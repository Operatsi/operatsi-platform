"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
  subscribeToNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  archiveNotification,
  restoreNotification,
  formatRelativeTime,
  dispatchRealEvent,
} from "@/lib/notifications";
import {
  BellIcon,
  CheckIcon,
  TasksCheckIcon,
  NanoAgentsIcon,
  WorkflowBranchIcon,
  CloudBrowserIcon,
  ExecutionCenterIcon,
  TeamIcon,
  CrmSalesIcon,
  BillingIcon,
  SettingsHexIcon,
  SearchIcon,
  PlusIcon,
} from "@/components/Icons";
import styles from "./inbox.module.css";

type TabType = "all" | "unread" | "assigned" | "archived";

export default function InboxPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [limitCount, setLimitCount] = useState<number>(30);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Raw notification streams
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth synchronization
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore subscription
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const filterOption = activeTab === "unread" ? "unread" : activeTab === "archived" ? "archived" : "all";

    const unsub = subscribeToNotifications(
      currentUser.uid,
      {
        filter: filterOption,
        category: categoryFilter !== "all" ? (categoryFilter as NotificationCategory) : "all",
        limitCount,
      },
      (items) => {
        setNotifications(items);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser?.uid, activeTab, categoryFilter, limitCount]);

  // In-memory search & priority filtering
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter for assigned / mentions
      if (activeTab === "assigned") {
        const isAssignedCat = item.category === "tasks" || item.category === "approvals";
        const hasMention = item.title.toLowerCase().includes("assigned") || item.body.toLowerCase().includes("assigned");
        if (!isAssignedCat && !hasMention) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesBody = item.body.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody && !matchesCat) return false;
      }

      return true;
    });
  }, [notifications, activeTab, priorityFilter, searchQuery]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt && !n.archivedAt).length;
  }, [notifications]);

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkMarkRead = async () => {
    if (!currentUser?.uid || selectedIds.size === 0) return;
    await markAllNotificationsAsRead(currentUser.uid, Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkArchive = async () => {
    if (!currentUser?.uid || selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      await archiveNotification(currentUser.uid, id);
    }
    setSelectedIds(new Set());
  };

  const handleMarkAllRead = async () => {
    if (!currentUser?.uid) return;
    const unreadIds = filteredNotifications.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsAsRead(currentUser.uid, unreadIds);
    }
  };

  // Test notification dispatcher
  const handleSendTestNotification = async (category: NotificationCategory = "tasks") => {
    if (!currentUser?.uid) return;
    setIsSendingTest(true);
    setTestFeedback(null);

    const testEvent = {
      recipientUid: currentUser.uid,
      recipientEmail: currentUser.email || undefined,
      category,
      type: "task_assigned",
      title: "Task Assigned: Review SOC2 Telemetry Logs",
      body: "Krishanth delegated 'Enterprise Cluster Security Audit #940' for high-density execution review.",
      priority: "high" as NotificationPriority,
      resourceType: "task",
      resourceId: "task_940",
      actionUrl: "/my-tasks",
      actorName: currentUser.displayName || "Admin Console",
      workspaceId: "ws_primary",
    };

    const res = await dispatchRealEvent(testEvent);
    setIsSendingTest(false);
    if (res.success) {
      setTestFeedback("Real-time event dispatched! Arrived in Firestore.");
      setTimeout(() => setTestFeedback(null), 4000);
    } else {
      setTestFeedback(res.error || "Failed to dispatch test notification");
    }
  };

  const renderCategoryIcon = (category: NotificationCategory, priority: string) => {
    const isUrgent = priority === "urgent";
    const iconSize = 18;
    let iconEl = <TasksCheckIcon size={iconSize} />;

    switch (category) {
      case "tasks":
        iconEl = <TasksCheckIcon size={iconSize} />;
        break;
      case "agents":
        iconEl = <NanoAgentsIcon size={iconSize} />;
        break;
      case "workflows":
        iconEl = <WorkflowBranchIcon size={iconSize} />;
        break;
      case "browser":
        iconEl = <CloudBrowserIcon size={iconSize} />;
        break;
      case "approvals":
        iconEl = <ExecutionCenterIcon size={iconSize} />;
        break;
      case "team":
        iconEl = <TeamIcon size={iconSize} />;
        break;
      case "crm":
        iconEl = <CrmSalesIcon size={iconSize} />;
        break;
      case "billing":
        iconEl = <BillingIcon size={iconSize} />;
        break;
      case "security":
        iconEl = <SettingsHexIcon size={iconSize} />;
        break;
    }

    return (
      <div className={`${styles.itemIconWrapper} ${isUrgent ? styles.itemIconUrgent : ""}`}>
        {iconEl}
      </div>
    );
  };

  return (
    <AppLayout activeRoute="/inbox">
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Inbox &amp; Activity Stream</h1>
              <span className={styles.liveBadge} title="Connected to Google Cloud Firestore onSnapshot stream">
                <span className={styles.liveDot} />
                <span>Firestore Live</span>
              </span>
            </div>
            <p className={styles.description}>
              Unified real-time notifications, human-in-the-loop decisions, and autonomous agent executions.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckIcon size={14} />
              <span>Mark all as read</span>
            </button>
            <Link href="/settings" className={styles.actionBtn}>
              <SettingsHexIcon size={14} />
              <span>Notification Settings</span>
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className={styles.tabsContainer} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Activity</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "unread"}
            className={`${styles.tabBtn} ${activeTab === "unread" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            <span>Unread</span>
            {unreadCount > 0 && <span className={styles.tabBadge}>{unreadCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "assigned"}
            className={`${styles.tabBtn} ${activeTab === "assigned" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("assigned")}
          >
            <span>Assigned to Me</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "archived"}
            className={`${styles.tabBtn} ${activeTab === "archived" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("archived")}
          >
            <span>Archived</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <SearchIcon size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search notifications, actors, or resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterControls}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="tasks">Tasks &amp; Projects</option>
              <option value="agents">AI &amp; Nano Agents</option>
              <option value="workflows">Workflows &amp; Automation</option>
              <option value="browser">Cloud Browser</option>
              <option value="approvals">Approvals &amp; HITL</option>
              <option value="team">Workspace &amp; Team</option>
              <option value="crm">CRM &amp; Sales</option>
              <option value="billing">Billing &amp; Usage</option>
              <option value="security">Security &amp; Compliance</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={styles.selectInput}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.size > 0 && (
          <div className={styles.selectionBar}>
            <span className={styles.selectionText}>{selectedIds.size} notification(s) selected</span>
            <div className={styles.selectionActions}>
              <button type="button" className={styles.actionBtn} onClick={handleBulkMarkRead}>
                Mark as Read
              </button>
              <button type="button" className={styles.actionBtn} onClick={handleBulkArchive}>
                Archive Selected
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                style={{ background: "none", border: "none" }}
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* List of Notifications */}
        {isLoading ? (
          <div className={styles.emptyCard}>
            <p style={{ color: "var(--text-muted)" }}>Loading real-time notifications stream...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <BellIcon size={28} />
            </div>
            <h3 className={styles.emptyTitle}>
              {activeTab === "unread"
                ? "All caught up! Zero unread notifications."
                : activeTab === "archived"
                ? "No archived notifications."
                : activeTab === "assigned"
                ? "No direct assignments or mentions."
                : "No notifications match your current filter."}
            </h3>
            <p className={styles.emptySubtitle}>
              New activity from autonomous agent runs, project delegations, and approvals will stream here in real time.
            </p>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.primaryBtn}`}
              onClick={() => handleSendTestNotification("tasks")}
              disabled={isSendingTest}
            >
              <PlusIcon size={14} />
              <span>{isSendingTest ? "Dispatching event..." : "Send Test Notification"}</span>
            </button>

            {testFeedback && (
              <p style={{ color: "var(--brand-accent)", fontSize: "0.82rem", marginTop: "0.75rem" }}>
                {testFeedback}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.notificationList}>
            {filteredNotifications.map((item) => {
              const isUnread = !item.readAt;
              const isArchived = Boolean(item.archivedAt);
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`${styles.itemCard} ${isUnread ? styles.itemCardUnread : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(item.id)}
                    className={styles.itemCheckbox}
                    aria-label={`Select ${item.title}`}
                  />

                  {renderCategoryIcon(item.category, item.priority)}

                  <div className={styles.itemBodyCol}>
                    <div className={styles.itemTopRow}>
                      <div className={styles.itemTitleGroup}>
                        <h2 className={styles.itemTitle}>{item.title}</h2>
                        {isUnread && <span className={styles.unreadPill}>Unread</span>}
                      </div>
                      <span className={styles.itemTimestamp}>{formatRelativeTime(item.createdAt)}</span>
                    </div>

                    <p className={styles.itemText}>{item.body}</p>

                    <div className={styles.itemBottomRow}>
                      <div className={styles.metaGroup}>
                        <span className={styles.metaPill}>{item.category}</span>
                        {item.priority === "urgent" && (
                          <span className={`${styles.metaPill} ${styles.priorityPillUrgent}`}>
                            Urgent Priority
                          </span>
                        )}
                        {item.priority === "high" && (
                          <span className={`${styles.metaPill} ${styles.priorityPillHigh}`}>
                            High Priority
                          </span>
                        )}
                        {item.actorName && (
                          <span className={styles.metaPill}>By: {item.actorName}</span>
                        )}
                      </div>

                      <div className={styles.itemActions}>
                        {item.actionUrl && (
                          <Link href={item.actionUrl} className={`${styles.itemBtn} ${styles.actionLinkBtn}`}>
                            <span>View Resource &rarr;</span>
                          </Link>
                        )}

                        {isUnread ? (
                          <button
                            type="button"
                            className={styles.itemBtn}
                            onClick={() => currentUser?.uid && markNotificationAsRead(currentUser.uid, item.id)}
                            title="Mark as read"
                          >
                            <CheckIcon size={12} />
                            <span>Mark read</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.itemBtn}
                            onClick={() => currentUser?.uid && markNotificationAsUnread(currentUser.uid, item.id)}
                            title="Mark as unread"
                          >
                            <span>Mark unread</span>
                          </button>
                        )}

                        {isArchived ? (
                          <button
                            type="button"
                            className={styles.itemBtn}
                            onClick={() => currentUser?.uid && restoreNotification(currentUser.uid, item.id)}
                            title="Restore notification"
                          >
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.itemBtn}
                            onClick={() => currentUser?.uid && archiveNotification(currentUser.uid, item.id)}
                            title="Archive notification"
                          >
                            <span>Archive</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Bar */}
            {filteredNotifications.length >= limitCount && (
              <div className={styles.loadMoreWrapper}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setLimitCount((prev) => prev + 25)}
                >
                  Load More Activity
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Event Test Bar */}
        <div className={styles.testEventBar}>
          <div className={styles.testEventText}>
            <strong>Real-time Verification:</strong> Trigger an authentic backend event to verify Firestore synchronization and push delivery.
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleSendTestNotification("agents")}
              disabled={isSendingTest}
            >
              Test Agent Completion
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleSendTestNotification("approvals")}
              disabled={isSendingTest}
            >
              Test HITL Approval
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleSendTestNotification("security")}
              disabled={isSendingTest}
            >
              Test Security Alert
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
