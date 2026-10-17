"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
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
} from "./Icons";
import {
  NotificationItem,
  subscribeToNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatRelativeTime,
  NotificationCategory,
} from "@/lib/notifications";
import styles from "./NotificationBell.module.css";

interface NotificationBellProps {
  currentUser: User | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Subscribe to real-time unread count and preview items
  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    const unsubCount = subscribeToUnreadCount(currentUser.uid, (count) => {
      setUnreadCount(count);
    });

    const unsubList = subscribeToNotifications(
      currentUser.uid,
      { filter: "all", limitCount: 5 },
      (items) => {
        setRecentNotifications(items);
      }
    );

    return () => {
      unsubCount();
      unsubList();
    };
  }, [currentUser?.uid]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid || recentNotifications.length === 0) return;
    const unreadIds = recentNotifications.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsAsRead(currentUser.uid, unreadIds);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (currentUser?.uid && !item.readAt) {
      await markNotificationAsRead(currentUser.uid, item.id);
    }
    setIsOpen(false);
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const handleMarkSingleRead = async (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    if (!currentUser?.uid) return;
    await markNotificationAsRead(currentUser.uid, item.id);
  };

  const renderCategoryIcon = (category: NotificationCategory, priority: string) => {
    const isUrgent = priority === "urgent";
    const iconSize = 15;
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
    <div className={styles.bellWrapper}>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.bellBtn} ${isOpen ? styles.bellBtnActive : ""}`}
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        aria-label="View notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <BellIcon size={16} />
        {unreadCount > 0 && (
          <span className={styles.badgePill} aria-live="polite">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={popoverRef} className={styles.popover} role="dialog" aria-label="Notifications preview">
          {/* Header */}
          <div className={styles.popoverHeader}>
            <div className={styles.popoverTitleGroup}>
              <h3 className={styles.popoverTitle}>Notifications</h3>
              {unreadCount > 0 && (
                <span className={styles.countPill}>{unreadCount} unread</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className={styles.popoverList}>
            {recentNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <CheckIcon size={24} />
                </div>
                <h4 className={styles.emptyTitle}>All caught up</h4>
                <p className={styles.emptySubtitle}>No recent activity in this workspace.</p>
              </div>
            ) : (
              recentNotifications.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <div
                    key={item.id}
                    className={`${styles.notificationRow} ${isUnread ? styles.notificationRowUnread : ""}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {isUnread && <span className={styles.unreadDot} />}
                    {renderCategoryIcon(item.category, item.priority)}
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={styles.itemTime}>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <p className={styles.itemBody}>{item.body}</p>
                      <div className={styles.itemMeta}>
                        <span className={styles.categoryTag}>{item.category}</span>
                        {item.priority === "urgent" && (
                          <span className={styles.priorityTagUrgent}>Urgent</span>
                        )}
                        {isUnread && (
                          <button
                            type="button"
                            className={styles.markReadRowBtn}
                            title="Mark as read"
                            onClick={(e) => handleMarkSingleRead(e, item)}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={styles.popoverFooter}>
            <Link
              href="/inbox"
              className={styles.footerLink}
              onClick={() => setIsOpen(false)}
            >
              Open Inbox &rarr;
            </Link>
            <Link
              href="/settings"
              className={styles.footerSecondaryLink}
              onClick={() => setIsOpen(false)}
            >
              Preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
