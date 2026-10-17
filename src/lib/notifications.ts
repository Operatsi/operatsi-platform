import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  writeBatch,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type NotificationCategory =
  | "tasks"
  | "agents"
  | "workflows"
  | "browser"
  | "approvals"
  | "team"
  | "crm"
  | "billing"
  | "security";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationItem {
  id: string;
  schemaVersion: number;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  workspaceId: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  resourceType: string;
  resourceId: string;
  actionUrl: string;
  priority: NotificationPriority;
  deduplicationKey?: string;
  createdAt: any;
  readAt: any | null;
  archivedAt: any | null;
}

export interface CategoryPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  categoryPreferences: Record<NotificationCategory, CategoryPreference>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format, e.g. "22:00"
    endTime: string;   // HH:mm format, e.g. "08:00"
    timezone: string;
  };
  digestFrequency: "immediate" | "daily" | "weekly";
  updatedAt?: any;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppEnabled: true,
  pushEnabled: false,
  emailEnabled: true,
  categoryPreferences: {
    tasks: { inApp: true, email: true, push: true },
    agents: { inApp: true, email: true, push: true },
    workflows: { inApp: true, email: false, push: true },
    browser: { inApp: true, email: false, push: true },
    approvals: { inApp: true, email: true, push: true },
    team: { inApp: true, email: true, push: false },
    crm: { inApp: true, email: true, push: false },
    billing: { inApp: true, email: true, push: false },
    security: { inApp: true, email: true, push: true }, // Mandatory
  },
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  },
  digestFrequency: "immediate",
};

export const NOTIFICATION_CATEGORIES_INFO: Record<
  NotificationCategory,
  { label: string; description: string; icon: string; mandatory?: boolean }
> = {
  tasks: {
    label: "Tasks & Projects",
    description: "Assignments, approaching due dates, completed deliverables, and milestone reachings.",
    icon: "TasksCheckIcon",
  },
  agents: {
    label: "AI & Nano Agents",
    description: "Cluster runs, agent execution completion, failures, and resource limits.",
    icon: "NanoAgentsIcon",
  },
  workflows: {
    label: "Workflows & Automation",
    description: "Pipeline branch execution, scheduled batch triggers, and step failures.",
    icon: "WorkflowBranchIcon",
  },
  browser: {
    label: "Cloud Browser",
    description: "Browser sandbox start, session completion, timeouts, and CAPTCHA interventions.",
    icon: "CloudBrowserIcon",
  },
  approvals: {
    label: "Approvals & HITL",
    description: "Urgent Human-in-the-Loop decision requests, signatures, and delegation timeouts.",
    icon: "ExecutionCenterIcon",
  },
  team: {
    label: "Workspace & Team",
    description: "New member onboardings, role permissions adjustments, and company announcements.",
    icon: "TeamIcon",
  },
  crm: {
    label: "CRM & Sales",
    description: "New lead delegations, stage conversions, and contract signature alerts.",
    icon: "CrmSalesIcon",
  },
  billing: {
    label: "Billing & Usage",
    description: "Tier renewal notices, invoice receipts, credit thresholds, and plan limits.",
    icon: "BillingIcon",
  },
  security: {
    label: "Security & Compliance",
    description: "New IP logins, session revocations, password updates, and policy enforcement.",
    icon: "SettingsHexIcon",
    mandatory: true,
  },
};

/**
 * Real-time subscription to notifications collection for a user
 */
export function subscribeToNotifications(
  uid: string,
  options: {
    filter?: "all" | "unread" | "archived";
    category?: NotificationCategory | "all";
    limitCount?: number;
  },
  onUpdate: (notifications: NotificationItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  const notificationsRef = collection(db, "users", uid, "notifications");
  const maxLimit = options.limitCount || 50;

  // Build constraints
  const constraints: any[] = [];

  if (options.filter === "unread") {
    constraints.push(where("readAt", "==", null));
    constraints.push(where("archivedAt", "==", null));
  } else if (options.filter === "archived") {
    // Note: archived notifications have non-null archivedAt
    // We'll filter in memory if compound inequalities are restricted
  } else {
    // "all" active inbox view: only non-archived
    constraints.push(where("archivedAt", "==", null));
  }

  if (options.category && options.category !== "all") {
    constraints.push(where("category", "==", options.category));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(maxLimit));

  const q = query(notificationsRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // If filtering for archived specifically:
        if (options.filter === "archived" && !data.archivedAt) {
          return;
        }
        items.push({
          id: docSnap.id,
          schemaVersion: data.schemaVersion || 1,
          type: data.type || "general",
          category: data.category || "tasks",
          title: data.title || "",
          body: data.body || "",
          workspaceId: data.workspaceId || "ws_default",
          actorId: data.actorId,
          actorName: data.actorName,
          actorAvatar: data.actorAvatar,
          resourceType: data.resourceType || "task",
          resourceId: data.resourceId || "",
          actionUrl: data.actionUrl || "/inbox",
          priority: data.priority || "normal",
          deduplicationKey: data.deduplicationKey,
          createdAt: data.createdAt,
          readAt: data.readAt || null,
          archivedAt: data.archivedAt || null,
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error("[Notifications] Listener error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to unread count
 */
export function subscribeToUnreadCount(
  uid: string,
  onUpdate: (count: number) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!uid) {
    onUpdate(0);
    return () => {};
  }

  const notificationsRef = collection(db, "users", uid, "notifications");
  const q = query(
    notificationsRef,
    where("readAt", "==", null),
    where("archivedAt", "==", null),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (err) => {
      console.error("[Notifications] Unread count listener error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to Notification Preferences
 */
export function subscribeToPreferences(
  uid: string,
  onUpdate: (prefs: NotificationPreferences) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!uid) {
    onUpdate(DEFAULT_NOTIFICATION_PREFERENCES);
    return () => {};
  }

  const docRef = doc(db, "users", uid, "settings", "notifications");

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          inAppEnabled: data.inAppEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.inAppEnabled,
          pushEnabled: data.pushEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.pushEnabled,
          emailEnabled: data.emailEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
          categoryPreferences: {
            ...DEFAULT_NOTIFICATION_PREFERENCES.categoryPreferences,
            ...(data.categoryPreferences || {}),
            // Always keep security mandatory
            security: { inApp: true, email: true, push: true },
          },
          quietHours: {
            ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
            ...(data.quietHours || {}),
          },
          digestFrequency: data.digestFrequency || "immediate",
          updatedAt: data.updatedAt,
        });
      } else {
        // Defaults
        onUpdate(DEFAULT_NOTIFICATION_PREFERENCES);
      }
    },
    (err) => {
      console.error("[Notifications] Preferences listener error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(uid: string, notificationId: string): Promise<void> {
  if (!uid || !notificationId) return;
  const docRef = doc(db, "users", uid, "notifications", notificationId);
  await updateDoc(docRef, {
    readAt: serverTimestamp(),
  });
}

/**
 * Mark a single notification as unread
 */
export async function markNotificationAsUnread(uid: string, notificationId: string): Promise<void> {
  if (!uid || !notificationId) return;
  const docRef = doc(db, "users", uid, "notifications", notificationId);
  await updateDoc(docRef, {
    readAt: null,
  });
}

/**
 * Mark all notifications as read in batch
 */
export async function markAllNotificationsAsRead(uid: string, notificationIds: string[]): Promise<void> {
  if (!uid || !notificationIds || notificationIds.length === 0) return;
  const batch = writeBatch(db);
  const now = Timestamp.now();
  notificationIds.forEach((id) => {
    const docRef = doc(db, "users", uid, "notifications", id);
    batch.update(docRef, { readAt: now });
  });
  await batch.commit();
}

/**
 * Archive a notification
 */
export async function archiveNotification(uid: string, notificationId: string): Promise<void> {
  if (!uid || !notificationId) return;
  const docRef = doc(db, "users", uid, "notifications", notificationId);
  await updateDoc(docRef, {
    archivedAt: serverTimestamp(),
  });
}

/**
 * Restore an archived notification
 */
export async function restoreNotification(uid: string, notificationId: string): Promise<void> {
  if (!uid || !notificationId) return;
  const docRef = doc(db, "users", uid, "notifications", notificationId);
  await updateDoc(docRef, {
    archivedAt: null,
  });
}

/**
 * Save notification preferences to Firestore and backend API
 */
export async function saveNotificationPreferences(
  uid: string,
  preferences: NotificationPreferences
): Promise<void> {
  if (!uid) throw new Error("Authenticated user required to save notification preferences");

  // Validate security category remains enforced
  const validatedPrefs: NotificationPreferences = {
    ...preferences,
    categoryPreferences: {
      ...preferences.categoryPreferences,
      security: { inApp: true, email: true, push: true },
    },
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, "users", uid, "settings", "notifications");
  await setDoc(docRef, validatedPrefs, { merge: true });

  // Sync to server backend API
  try {
    await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, preferences: validatedPrefs }),
    });
  } catch (err) {
    console.warn("[Notifications] Backend sync warning:", err);
  }
}

/**
 * Register FCM device push token with backend
 */
export async function registerDeviceToken(
  uid: string,
  fcmToken: string,
  metadata?: { browser?: string; os?: string; deviceType?: string }
): Promise<boolean> {
  try {
    const res = await fetch("/api/notifications/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, fcmToken, metadata }),
    });
    return res.ok;
  } catch (err) {
    console.error("[Notifications] Device token registration error:", err);
    return false;
  }
}

/**
 * Revoke FCM device push token
 */
export async function unregisterDeviceToken(uid: string, fcmToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/notifications/devices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, fcmToken }),
    });
    return res.ok;
  } catch (err) {
    console.error("[Notifications] Device token revocation error:", err);
    return false;
  }
}

/**
 * Dispatch real notification event via backend event processing engine
 */
export async function dispatchRealEvent(event: {
  recipientUid: string;
  recipientEmail?: string;
  category: NotificationCategory;
  type: string;
  title: string;
  body: string;
  priority?: NotificationPriority;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  actorName?: string;
  workspaceId?: string;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const res = await fetch("/api/notifications/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to dispatch notification event" };
  }
}

/**
 * Format relative timestamp (e.g., "Just now", "5m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return "Just now";

  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (dateInput?.toDate && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "number" || typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput?.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else {
    return "Just now";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
