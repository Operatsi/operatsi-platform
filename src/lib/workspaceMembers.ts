// ===============================================================
// OPERATSI — WORKSPACE MEMBERSHIP & ROLE-BASED ACCESS CONTROL (RBAC)
// Enterprise Multi-Tenant Types, Permissions Matrix & Utilities
// ===============================================================

export type WorkspaceRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type MembershipStatus = "active" | "invited" | "suspended";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type DeliveryStatus = "delivered" | "failed" | "pending";

export type WorkspacePermission =
  | "members.read"
  | "members.invite"
  | "members.remove"
  | "members.role.update"
  | "invitations.revoke"
  | "invitations.resend"
  | "invitations.change_role"
  | "workspace.settings.update"
  | "billing.manage"
  | "agents.execute"
  | "agents.manage"
  | "approvals.manage"
  | "audit.read";

export interface RoleDefinition {
  id: WorkspaceRole;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: WorkspacePermission[];
  badgeClass: string;
  assignableBy: WorkspaceRole[];
}

export const WORKSPACE_ROLES: Record<WorkspaceRole, RoleDefinition> = {
  owner: {
    id: "owner",
    name: "Owner",
    description: "Complete authority over workspace, financial billing, owner transfer, security policies, and administrators.",
    isSystemRole: true,
    badgeClass: "badgeDanger",
    assignableBy: [], // Cannot be assigned via normal invitation; requires ownership transfer
    permissions: [
      "members.read",
      "members.invite",
      "members.remove",
      "members.role.update",
      "invitations.revoke",
      "invitations.resend",
      "invitations.change_role",
      "workspace.settings.update",
      "billing.manage",
      "agents.execute",
      "agents.manage",
      "approvals.manage",
      "audit.read",
    ],
  },
  admin: {
    id: "admin",
    name: "Admin",
    description: "Manage workspace configurations, team membership, role delegations, workflows, and operational audit telemetry.",
    isSystemRole: true,
    badgeClass: "badgeInfo",
    assignableBy: ["owner"],
    permissions: [
      "members.read",
      "members.invite",
      "members.remove",
      "members.role.update",
      "invitations.revoke",
      "invitations.resend",
      "invitations.change_role",
      "workspace.settings.update",
      "agents.execute",
      "agents.manage",
      "approvals.manage",
      "audit.read",
    ],
  },
  manager: {
    id: "manager",
    name: "Manager",
    description: "Coordinate team departments, supervise project task execution, review approval queues, and invite contributors.",
    isSystemRole: true,
    badgeClass: "badgeWarning",
    assignableBy: ["owner", "admin"],
    permissions: [
      "members.read",
      "members.invite",
      "agents.execute",
      "agents.manage",
      "approvals.manage",
    ],
  },
  member: {
    id: "member",
    name: "Member",
    description: "Execute assigned Nano Agents, manage project workflows, access CRM pipelines, and collaborate across teams.",
    isSystemRole: true,
    badgeClass: "badgeNeutral",
    assignableBy: ["owner", "admin", "manager"],
    permissions: [
      "members.read",
      "agents.execute",
    ],
  },
  viewer: {
    id: "viewer",
    name: "Viewer",
    description: "Strictly read-only visibility into authorized workspace dashboards, metrics, knowledge bases, and tasks.",
    isSystemRole: true,
    badgeClass: "badgeMuted",
    assignableBy: ["owner", "admin", "manager"],
    permissions: [
      "members.read",
    ],
  },
};

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  emailNormalized: string;
  name: string;
  displayName: string;
  avatarUrl?: string | null;
  role: WorkspaceRole;
  status: MembershipStatus;
  joinedAt: any;
  lastActiveAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  invitedEmail: string;
  invitedEmailNormalized: string;
  role: WorkspaceRole;
  invitedBy: string;
  inviterName: string;
  tokenHash: string;
  status: InvitationStatus;
  message?: string;
  expiresAt: any;
  deliveryStatus: DeliveryStatus;
  deliveryError?: string | null;
  deliveryMessageId?: string | null;
  acceptedBy?: string | null;
  acceptedAt?: any;
  revokedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface WorkspaceMembershipAudit {
  id: string;
  workspaceId: string;
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  targetUserId?: string | null;
  targetEmail: string;
  action:
    | "invitation_created"
    | "invitation_accepted"
    | "invitation_revoked"
    | "invitation_resent"
    | "invitation_role_changed"
    | "member_joined"
    | "member_removed"
    | "member_role_changed";
  previousValue?: string | null;
  newValue?: string | null;
  createdAt: any;
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  workspaceAdmins: number;
}

// ===============================================================
// EMAIL NORMALIZATION & VALIDATION
// ===============================================================

/**
 * Normalizes email address safely without breaking non-standard domain semantics:
 * Trims whitespace and converts domain and address to lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0) return trimmed.toLowerCase();

  const localPart = trimmed.slice(0, atIndex).trim();
  const domainPart = trimmed.slice(atIndex + 1).trim().toLowerCase();

  return `${localPart.toLowerCase()}@${domainPart}`;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(email.trim());
}

// ===============================================================
// RBAC PERMISSION HELPERS
// ===============================================================

export function hasPermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  const roleDef = WORKSPACE_ROLES[role];
  if (!roleDef) return false;
  return roleDef.permissions.includes(permission);
}

export function canAssignRole(inviterRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  if (targetRole === "owner") return false; // Owner cannot be assigned via invitation
  const roleDef = WORKSPACE_ROLES[targetRole];
  if (!roleDef) return false;
  return roleDef.assignableBy.includes(inviterRole);
}

export function canManageMemberRole(actorRole: WorkspaceRole, targetMemberRole: WorkspaceRole, newRole: WorkspaceRole): boolean {
  if (actorRole === "owner") {
    return true; // Owner can change any member's role (except creating duplicate owners without transfer)
  }
  if (actorRole === "admin") {
    // Admin cannot change an Owner's role, cannot promote anyone to Owner or Admin, and cannot modify other Admins
    if (targetMemberRole === "owner" || targetMemberRole === "admin") return false;
    if (newRole === "owner" || newRole === "admin") return false;
    return true;
  }
  return false;
}

export function canRemoveMember(actorRole: WorkspaceRole, targetMemberRole: WorkspaceRole): boolean {
  if (targetMemberRole === "owner") return false; // Last owner or any owner cannot be removed via normal removal
  if (actorRole === "owner") return true;
  if (actorRole === "admin") {
    return targetMemberRole !== "admin"; // Admin cannot remove other Admins or Owner
  }
  return false;
}
