"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./MembersAndRolesSection.module.css";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { subscribeToWorkspaceRealtime } from "@/lib/supabase/realtime";
import { User } from "firebase/auth";
import {
  WorkspaceRole,
  MembershipStatus,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceStats,
  WORKSPACE_ROLES,
  canAssignRole,
  canManageMemberRole,
  canRemoveMember,
  isValidEmail,
} from "@/lib/workspaceMembers";
import {
  TeamIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  SpinnerIcon,
  AlertCircleIcon,
  CopyIcon,
  TrashIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "@/components/Icons";

interface Props {
  currentUser: User | null;
  workspaceId?: string;
  workspaceName?: string;
  userTimezone?: string;
}

const DEFAULT_WORKSPACE_ID = "ws_primary";
const ROLES_LIST: WorkspaceRole[] = ["owner", "admin", "manager", "member", "viewer"];
const INVITABLE_ROLES: WorkspaceRole[] = ["admin", "manager", "member", "viewer"];

export function MembersAndRolesSection({
  currentUser,
  workspaceId = DEFAULT_WORKSPACE_ID,
  workspaceName = "OperatSI Enterprise Core",
  userTimezone = "UTC",
}: Props) {
  // Members & Stats state
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [actorRole, setActorRole] = useState<WorkspaceRole>("owner");
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "joined_desc" | "joined_asc">("joined_desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Invite Member Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteModalFeedback, setInviteModalFeedback] = useState<{ type: "success" | "error"; text: string; link?: string } | null>(null);

  // Change Role Modal state
  const [roleModalMember, setRoleModalMember] = useState<WorkspaceMember | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<WorkspaceRole>("member");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleModalFeedback, setRoleModalFeedback] = useState<string | null>(null);

  // Remove Member Modal state
  const [removeModalMember, setRemoveModalMember] = useState<WorkspaceMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [removeModalFeedback, setRemoveModalFeedback] = useState<string | null>(null);

  // Change Invitation Role Modal state
  const [roleModalInvitation, setRoleModalInvitation] = useState<WorkspaceInvitation | null>(null);
  const [selectedInviteNewRole, setSelectedInviteNewRole] = useState<WorkspaceRole>("member");
  const [isUpdatingInviteRole, setIsUpdatingInviteRole] = useState(false);

  // Action status toasts
  const [actionToast, setActionToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setActionToast({ type, text });
    setTimeout(() => setActionToast(null), 4000);
  };

  // 1. Initial Authorization & Fetch via API
  useEffect(() => {
    if (!currentUser) return;

    const fetchInitialData = async () => {
      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch(`/api/workspace/members?workspaceId=${encodeURIComponent(workspaceId)}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          if (data.actorRole) setActorRole(data.actorRole);
          if (data.members) setMembers(data.members);
        } else {
          setErrorNotice(data.error || "Failed to load workspace membership data");
        }
      } catch (err: any) {
        setErrorNotice(err.message || "Failed to initialize workspace permissions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser, workspaceId]);

  // 2. Real-Time Firestore Synchronization for Members
  useEffect(() => {
    if (!currentUser) return;

    const membersCol = collection(db, "workspaces", workspaceId, "members");
    const unsubMembers = onSnapshot(
      membersCol,
      (snapshot) => {
        const list: WorkspaceMember[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as WorkspaceMember);
        });

        // Determine current user's role from real-time snapshot
        const myDoc = list.find((m) => m.id === currentUser.uid || m.userId === currentUser.uid);
        if (myDoc?.role) {
          setActorRole(myDoc.role);
        }

        setMembers(list);
        setIsLoading(false);
      },
      (err) => {
        console.warn("[MembersAndRoles] Real-time members sync notice:", err);
      }
    );

    // 3. Real-Time Firestore Synchronization for Invitations
    const invitesCol = collection(db, "workspaces", workspaceId, "invitations");
    const qInvites = query(invitesCol, orderBy("createdAt", "desc"));
    const unsubInvites = onSnapshot(
      qInvites,
      (snapshot) => {
        const list: WorkspaceInvitation[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as WorkspaceInvitation);
        });
        setInvitations(list);
      },
      (err) => {
        console.warn("[MembersAndRoles] Real-time invitations sync notice:", err);
      }
    );

    // 4. Real-Time Supabase PostgreSQL Synchronization
    let unsubRealtime = () => {};
    currentUser.getIdToken().then((token) => {
      const handle = subscribeToWorkspaceRealtime({
        workspaceId,
        firebaseIdToken: token,
        onMemberChange: () => {
          // Re-fetch members upon PostgreSQL table update
          currentUser.getIdToken().then((freshToken) => {
            fetch(`/api/workspace/members?workspaceId=${encodeURIComponent(workspaceId)}`, {
              headers: { Authorization: `Bearer ${freshToken}` },
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.actorRole) setActorRole(data.actorRole);
                if (data.members) setMembers(data.members);
              })
              .catch(() => {});
          });
        },
        onInvitationChange: () => {
          // Re-fetch invitations upon PostgreSQL table update
          currentUser.getIdToken().then((freshToken) => {
            fetch(`/api/workspace/invitations?workspaceId=${encodeURIComponent(workspaceId)}`, {
              headers: { Authorization: `Bearer ${freshToken}` },
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.invitations) setInvitations(data.invitations);
              })
              .catch(() => {});
          });
        },
      });
      unsubRealtime = handle.unsubscribe;
    }).catch(() => {});

    return () => {
      unsubMembers();
      unsubInvites();
      unsubRealtime();
    };
  }, [currentUser, workspaceId]);

  // Format timestamps
  const formatTimestamp = (ts: any): string => {
    if (!ts) return "Recently";
    let date: Date;
    if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else if (ts instanceof Date) {
      date = ts;
    } else {
      date = new Date(ts);
    }

    if (isNaN(date.getTime())) return "Recently";

    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: userTimezone || "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  };

  const calculateLastActive = (ts: any): string => {
    if (!ts) return "Active recently";
    const millis = ts.seconds ? ts.seconds * 1000 : new Date(ts).getTime();
    if (!millis || isNaN(millis)) return "Active recently";
    const diff = Math.floor((Date.now() - millis) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Real Calculated Workspace Statistics
  const stats: WorkspaceStats = useMemo(() => {
    let active = 0;
    let admins = 0;
    members.forEach((m) => {
      if (m.status === "active") active++;
      if (m.role === "admin" || m.role === "owner") admins++;
    });
    const pending = invitations.filter((i) => i.status === "pending").length;
    return {
      totalMembers: members.length,
      activeMembers: active,
      pendingInvitations: pending,
      workspaceAdmins: admins,
    };
  }, [members, invitations]);

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (m.name || m.displayName || "").toLowerCase().includes(q);
          const matchEmail = (m.email || "").toLowerCase().includes(q);
          if (!matchName && !matchEmail) return false;
        }
        if (roleFilter !== "all" && m.role !== roleFilter) return false;
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") {
          return (a.name || a.email).localeCompare(b.name || b.email);
        }
        if (sortBy === "name_desc") {
          return (b.name || b.email).localeCompare(a.name || a.email);
        }
        if (sortBy === "joined_asc") {
          const tA = a.joinedAt?.seconds || 0;
          const tB = b.joinedAt?.seconds || 0;
          return tA - tB;
        }
        // joined_desc (default)
        const tA = a.joinedAt?.seconds || 0;
        const tB = b.joinedAt?.seconds || 0;
        return tB - tA;
      });
  }, [members, searchQuery, roleFilter, statusFilter, sortBy]);

  // Paginated Members
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Actions: Send Invitation
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!inviteEmail || !isValidEmail(inviteEmail)) {
      setInviteModalFeedback({ type: "error", text: "Please enter a valid work email address." });
      return;
    }

    setIsSendingInvite(true);
    setInviteModalFeedback(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch invitation.");
      }

      setInviteModalFeedback({
        type: "success",
        text: data.deliveryStatus === "delivered"
          ? `Invitation sent successfully to ${inviteEmail.trim()}.`
          : `Invitation created. (Email queued: ${data.deliveryError || "local environment"}).`,
        link: data.inviteUrl,
      });

      setInviteEmail("");
      setInviteMessage("");
      showToast("success", `Invitation issued for ${inviteRole}.`);
    } catch (err: any) {
      setInviteModalFeedback({ type: "error", text: err.message || "Failed to create invitation." });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Actions: Resend Invitation
  const handleResendInvitation = async (invitationId: string, email: string) => {
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/invitations/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ workspaceId, invitationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend invitation.");

      showToast("success", `Fresh invitation sent to ${email}.`);
    } catch (err: any) {
      showToast("error", err.message || "Could not resend invitation.");
    }
  };

  // Actions: Revoke Invitation
  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    if (!currentUser) return;
    if (!confirm(`Are you sure you want to permanently revoke the invitation for ${email}?`)) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/invitations/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ workspaceId, invitationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke invitation.");

      showToast("success", `Invitation for ${email} revoked.`);
    } catch (err: any) {
      showToast("error", err.message || "Could not revoke invitation.");
    }
  };

  // Actions: Copy Invitation Link (Rotates token safely)
  const handleCopyInvitationLink = async (invitationId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/invitations/copy-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ workspaceId, invitationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link.");

      await navigator.clipboard.writeText(data.inviteUrl);
      showToast("success", "Secure invitation link copied to clipboard!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to copy link.");
    }
  };

  // Actions: Change Member Role Submit
  const handleConfirmChangeRole = async () => {
    if (!currentUser || !roleModalMember) return;
    setIsUpdatingRole(true);
    setRoleModalFeedback(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/members/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          targetUserId: roleModalMember.userId || roleModalMember.id,
          newRole: selectedNewRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role.");

      showToast("success", `Role updated to ${selectedNewRole}.`);
      setRoleModalMember(null);
    } catch (err: any) {
      setRoleModalFeedback(err.message || "Failed to update member role.");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Actions: Remove Member Submit
  const handleConfirmRemoveMember = async () => {
    if (!currentUser || !removeModalMember) return;
    setIsRemovingMember(true);
    setRemoveModalFeedback(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/members/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          targetUserId: removeModalMember.userId || removeModalMember.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member.");

      showToast("success", `Removed ${removeModalMember.name || removeModalMember.email} from workspace.`);
      setRemoveModalMember(null);
    } catch (err: any) {
      setRemoveModalFeedback(err.message || "Failed to remove member.");
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Actions: Change Invitation Role Submit
  const handleConfirmChangeInviteRole = async () => {
    if (!currentUser || !roleModalInvitation) return;
    setIsUpdatingInviteRole(true);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/invitations/change-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          invitationId: roleModalInvitation.id,
          newRole: selectedInviteNewRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change invitation role.");

      showToast("success", `Invitation role updated to ${selectedInviteNewRole}.`);
      setRoleModalInvitation(null);
    } catch (err: any) {
      showToast("error", err.message || "Failed to change invitation role.");
    } finally {
      setIsUpdatingInviteRole(false);
    }
  };

  // Get Initials for Avatar
  const getInitials = (name?: string, email?: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "OP";
  };

  return (
    <div className={styles.container}>
      {/* 1. Header */}
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>
            <TeamIcon size={22} />
            <span>Members &amp; Roles</span>
          </h1>
          <p className={styles.pageDescription}>
            Invite your team, manage workspace access and control member permissions.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setIsInviteModalOpen(true);
              setInviteModalFeedback(null);
            }}
          >
            <TeamIcon size={14} />
            <span>Invite Members</span>
          </button>
        </div>
      </header>

      {/* Global Toast Alert */}
      {actionToast && (
        <div
          className={`${styles.feedbackAlert} ${
            actionToast.type === "success" ? styles.feedbackSuccess : styles.feedbackError
          }`}
        >
          {actionToast.type === "success" ? <CheckIcon size={16} /> : <AlertCircleIcon size={16} />}
          <span>{actionToast.text}</span>
        </div>
      )}

      {errorNotice && (
        <div className={`${styles.feedbackAlert} ${styles.feedbackError}`}>
          <AlertCircleIcon size={16} />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* 2. Workspace Membership Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Members</span>
          <span className={styles.statValue}>{isLoading ? "—" : stats.totalMembers}</span>
          <span className={styles.statSubtext}>Across all organizational roles</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Members</span>
          <span className={styles.statValue} style={{ color: "#22c55e" }}>
            {isLoading ? "—" : stats.activeMembers}
          </span>
          <span className={styles.statSubtext}>Authenticated &amp; operational</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Invitations</span>
          <span className={styles.statValue} style={{ color: "#60a5fa" }}>
            {isLoading ? "—" : stats.pendingInvitations}
          </span>
          <span className={styles.statSubtext}>Awaiting collaborator acceptance</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Workspace Administrators</span>
          <span className={styles.statValue} style={{ color: "#fb923c" }}>
            {isLoading ? "—" : stats.workspaceAdmins}
          </span>
          <span className={styles.statSubtext}>Owners and Admin delegation</span>
        </div>
      </div>

      {/* 3. Members Directory */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionHeaderTitle}>Workspace Members Directory</h2>
            <p className={styles.sectionHeaderSubtitle}>
              Active users with authorized role-based credentials in {workspaceName}.
            </p>
          </div>
          <span className={styles.badge} style={{ background: "rgba(37, 99, 235, 0.1)", color: "var(--brand-accent)" }}>
            Your Role: {actorRole.toUpperCase()}
          </span>
        </div>

        {/* Toolbar: Search, Filters, Sorting */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <SearchIcon size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search members by name or email..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <select
            className={styles.selectInput}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>

          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            className={styles.selectInput}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="joined_desc">Newest Joined</option>
            <option value="joined_asc">Oldest Joined</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>

        {/* Members Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Joined</th>
                <th>Last Active</th>
                <th style={{ textAlign: "right" }}>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>
                      <SpinnerIcon size={24} />
                    </div>
                    <div style={{ marginTop: "0.5rem", color: "var(--text-muted)" }}>Loading directory...</div>
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <TeamIcon size={32} />
                      <div className={styles.emptyTitle}>No members found</div>
                      <div className={styles.emptySubtitle}>
                        {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                          ? "Try clearing your filters or search terms."
                          : "Invite team members to populate your workspace directory."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const roleDef = WORKSPACE_ROLES[member.role] || WORKSPACE_ROLES.member;
                  const canEditThisRole = canManageMemberRole(actorRole, member.role, "member") || actorRole === "owner";
                  const canRemoveThisUser = canRemoveMember(actorRole, member.role) && member.userId !== currentUser?.uid;

                  return (
                    <tr key={member.id || member.userId}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {getInitials(member.name || member.displayName, member.email)}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>
                              {member.name || member.displayName || member.email.split("@")[0]}
                              {member.userId === currentUser?.uid && (
                                <span style={{ fontSize: "0.68rem", color: "var(--brand-accent)", fontWeight: 700 }}>
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className={styles.userEmail}>{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[roleDef.badgeClass] || styles.badgeNeutral}`}>
                          {roleDef.name}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${member.status === "active" ? styles.badgeSuccess : styles.badgeMuted}`}>
                          <CheckIcon size={11} /> {member.status || "Active"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                        {formatTimestamp(member.joinedAt)}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {calculateLastActive(member.lastActiveAt || member.updatedAt)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionsCell} style={{ justifyContent: "flex-end" }}>
                          {canEditThisRole && member.role !== "owner" && (
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              onClick={() => {
                                setRoleModalMember(member);
                                setSelectedNewRole(member.role);
                                setRoleModalFeedback(null);
                              }}
                            >
                              Change Role
                            </button>
                          )}

                          {canRemoveThisUser && (
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => {
                                setRemoveModalMember(member);
                                setRemoveModalFeedback(null);
                              }}
                            >
                              <TrashIcon size={12} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredMembers.length > pageSize && (
          <div className={styles.pagination}>
            <span>
              Showing {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} members
            </span>
            <div className={styles.pageControls}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pending Invitations Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionHeaderTitle}>Pending Invitations ({invitations.filter((i) => i.status === "pending").length})</h2>
            <p className={styles.sectionHeaderSubtitle}>
              Collaborators invited via secure transactional email awaiting token consumption.
            </p>
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => {
              setIsInviteModalOpen(true);
              setInviteModalFeedback(null);
            }}
          >
            <span>+ Send New Invitation</span>
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invited Email</th>
                <th>Assigned Role</th>
                <th>Invited By</th>
                <th>Date Sent</th>
                <th>Expires</th>
                <th>Delivery</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyTitle}>No pending invitations</div>
                      <div className={styles.emptySubtitle}>All issued invitations have been accepted or expired.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const isPending = inv.status === "pending";
                  const roleDef = WORKSPACE_ROLES[inv.role] || WORKSPACE_ROLES.member;

                  return (
                    <tr key={inv.id}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{inv.invitedEmail}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[roleDef.badgeClass] || styles.badgeNeutral}`}>
                          {roleDef.name}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                        {inv.inviterName}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                        {formatTimestamp(inv.createdAt)}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {formatTimestamp(inv.expiresAt)}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            inv.deliveryStatus === "delivered"
                              ? styles.badgeSuccess
                              : inv.deliveryStatus === "failed"
                              ? styles.badgeDanger
                              : styles.badgeMuted
                          }`}
                        >
                          {inv.deliveryStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            inv.status === "accepted"
                              ? styles.badgeSuccess
                              : inv.status === "pending"
                              ? styles.badgeInfo
                              : styles.badgeDanger
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionsCell} style={{ justifyContent: "flex-end" }}>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                title="Resend fresh invitation email"
                                onClick={() => handleResendInvitation(inv.id, inv.invitedEmail)}
                              >
                                Resend
                              </button>

                              <button
                                type="button"
                                className={styles.btnSecondary}
                                title="Copy secure link (rotates token)"
                                onClick={() => handleCopyInvitationLink(inv.id)}
                              >
                                <CopyIcon size={12} />
                                <span>Copy Link</span>
                              </button>

                              <button
                                type="button"
                                className={styles.btnSecondary}
                                title="Change invited role"
                                onClick={() => {
                                  setRoleModalInvitation(inv);
                                  setSelectedInviteNewRole(inv.role);
                                }}
                              >
                                Role
                              </button>

                              <button
                                type="button"
                                className={styles.btnDanger}
                                title="Revoke invitation"
                                onClick={() => handleRevokeInvitation(inv.id, inv.invitedEmail)}
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Role-Based Access Control Reference Matrix */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionHeaderTitle}>Workspace Role Permissions Matrix (RBAC)</h2>
            <p className={styles.sectionHeaderSubtitle}>
              Server-enforced authorization policies controlling tenant actions and feature delegations.
            </p>
          </div>
          <span className={styles.badge} style={{ background: "rgba(22, 163, 74, 0.1)", color: "#22c55e" }}>
            <ShieldCheckIcon size={12} /> Real-Time Enforced
          </span>
        </div>

        <div className={styles.matrixGrid}>
          {ROLES_LIST.map((roleKey) => {
            const role = WORKSPACE_ROLES[roleKey];
            return (
              <div key={role.id} className={styles.matrixCard}>
                <div className={styles.matrixRoleHeader}>
                  <span className={`${styles.badge} ${styles[role.badgeClass] || styles.badgeNeutral}`}>
                    {role.name}
                  </span>
                  {role.id === "owner" && (
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Protected Tier
                    </span>
                  )}
                </div>
                <p className={styles.matrixDesc}>{role.description}</p>
                <div className={styles.matrixPerms}>
                  {role.permissions.map((p) => (
                    <span key={p} className={styles.matrixPill}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===============================================================
          MODALS
          =============================================================== */}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInviteModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Invite Workspace Collaborator</h3>
                <p className={styles.modalSubtitle}>
                  Send a cryptographically secure email invitation to join {workspaceName}.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsInviteModalOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSendInvitation}>
              <div className={styles.modalBody}>
                {inviteModalFeedback && (
                  <div
                    className={`${styles.feedbackAlert} ${
                      inviteModalFeedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError
                    }`}
                  >
                    {inviteModalFeedback.type === "success" ? <CheckIcon size={16} /> : <AlertCircleIcon size={16} />}
                    <div style={{ flex: 1 }}>
                      <div>{inviteModalFeedback.text}</div>
                      {inviteModalFeedback.link && (
                        <div style={{ marginTop: "0.4rem" }}>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            style={{ fontSize: "0.72rem" }}
                            onClick={() => {
                              navigator.clipboard.writeText(inviteModalFeedback.link!);
                              showToast("success", "Invite link copied to clipboard!");
                            }}
                          >
                            <CopyIcon size={11} /> Copy Direct Acceptance Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Work Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter team member's work email"
                    className={styles.input}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Workspace Role</label>
                  <select
                    className={styles.selectInput}
                    style={{ width: "100%" }}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  >
                    {INVITABLE_ROLES.map((r) => {
                      const isAllowed = canAssignRole(actorRole, r);
                      return (
                        <option key={r} value={r} disabled={!isAllowed}>
                          {WORKSPACE_ROLES[r].name} {!isAllowed ? "(Unauthorized)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem", display: "block" }}>
                    {WORKSPACE_ROLES[inviteRole]?.description}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Optional Personal Message</label>
                  <textarea
                    placeholder="Add an optional welcome note for the recipient..."
                    className={styles.textarea}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    maxLength={300}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isSendingInvite}
                >
                  {isSendingInvite ? (
                    <>
                      <SpinnerIcon size={14} />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Member Role Modal */}
      {roleModalMember && (
        <div className={styles.modalOverlay} onClick={() => setRoleModalMember(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Change Member Role</h3>
                <p className={styles.modalSubtitle}>
                  Update workspace access permissions for {roleModalMember.name || roleModalMember.email}.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setRoleModalMember(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {roleModalFeedback && (
                <div className={`${styles.feedbackAlert} ${styles.feedbackError}`}>
                  <AlertCircleIcon size={16} />
                  <span>{roleModalFeedback}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select New Role</label>
                <select
                  className={styles.selectInput}
                  style={{ width: "100%" }}
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as WorkspaceRole)}
                >
                  {ROLES_LIST.map((r) => {
                    const isAllowed = canManageMemberRole(actorRole, roleModalMember.role, r);
                    return (
                      <option key={r} value={r} disabled={!isAllowed}>
                        {WORKSPACE_ROLES[r].name} {!isAllowed ? "(Unauthorized)" : ""}
                      </option>
                    );
                  })}
                </select>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "block" }}>
                  {WORKSPACE_ROLES[selectedNewRole]?.description}
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setRoleModalMember(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleConfirmChangeRole}
                disabled={isUpdatingRole || selectedNewRole === roleModalMember.role}
              >
                {isUpdatingRole ? (
                  <>
                    <SpinnerIcon size={14} />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Role Update</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {removeModalMember && (
        <div className={styles.modalOverlay} onClick={() => setRemoveModalMember(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Remove Workspace Member</h3>
                <p className={styles.modalSubtitle}>Revoke workspace access for this collaborator.</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setRemoveModalMember(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {removeModalFeedback && (
                <div className={`${styles.feedbackAlert} ${styles.feedbackError}`}>
                  <AlertCircleIcon size={16} />
                  <span>{removeModalFeedback}</span>
                </div>
              )}

              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to remove <strong>{removeModalMember.name || removeModalMember.email}</strong> from {workspaceName}?
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Their workspace authorization will be revoked immediately and all active sessions in this workspace will terminate.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setRemoveModalMember(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleConfirmRemoveMember}
                disabled={isRemovingMember}
              >
                {isRemovingMember ? (
                  <>
                    <SpinnerIcon size={14} />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove Member</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Invitation Role Modal */}
      {roleModalInvitation && (
        <div className={styles.modalOverlay} onClick={() => setRoleModalInvitation(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Change Invitation Role</h3>
                <p className={styles.modalSubtitle}>
                  Update the assigned role for {roleModalInvitation.invitedEmail}.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setRoleModalInvitation(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Role</label>
                <select
                  className={styles.selectInput}
                  style={{ width: "100%" }}
                  value={selectedInviteNewRole}
                  onChange={(e) => setSelectedInviteNewRole(e.target.value as WorkspaceRole)}
                >
                  {INVITABLE_ROLES.map((r) => {
                    const isAllowed = canAssignRole(actorRole, r);
                    return (
                      <option key={r} value={r} disabled={!isAllowed}>
                        {WORKSPACE_ROLES[r].name} {!isAllowed ? "(Unauthorized)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setRoleModalInvitation(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleConfirmChangeInviteRole}
                disabled={isUpdatingInviteRole || selectedInviteNewRole === roleModalInvitation.role}
              >
                {isUpdatingInviteRole ? "Updating..." : "Update Invitation Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
