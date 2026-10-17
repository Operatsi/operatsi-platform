import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { app } from "./firebase";
import { registerDeviceToken, unregisterDeviceToken } from "./notifications";

export interface PushSupportStatus {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  serviceWorkerReady: boolean;
}

export function checkPushSupport(): PushSupportStatus {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return {
      supported: false,
      permission: "unsupported",
      serviceWorkerReady: false,
    };
  }

  return {
    supported: true,
    permission: Notification.permission,
    serviceWorkerReady: true,
  };
}

let messagingInstance: Messaging | null = null;

export function getClientMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  const status = checkPushSupport();
  if (!status.supported) return null;

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (e) {
      console.warn("[FCM] Failed to initialize getMessaging:", e);
    }
  }
  return messagingInstance;
}

/**
 * Request notification permission, register service worker, and obtain FCM push token
 */
export async function enablePushNotifications(uid: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  permission: NotificationPermission | "unsupported";
}> {
  const status = checkPushSupport();
  if (!status.supported) {
    return {
      success: false,
      error: "Browser Push Notifications are not supported in this browser.",
      permission: "unsupported",
    };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error: "Notification permission was denied or dismissed.",
        permission,
      };
    }

    // 2. Register service worker
    const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // 3. Get messaging instance
    const messaging = getClientMessaging();
    if (!messaging) {
      return {
        success: false,
        error: "Firebase Messaging could not be instantiated in this browser context.",
        permission,
      };
    }

    // 4. Retrieve FCM Token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      serviceWorkerRegistration: swRegistration,
      ...(vapidKey ? { vapidKey } : {}),
    });

    if (!token) {
      return {
        success: false,
        error: "Failed to generate FCM registration token.",
        permission,
      };
    }

    // 5. Register token with backend
    await registerDeviceToken(uid, token, {
      browser: navigator.userAgent,
      os: navigator.platform,
      deviceType: "Desktop",
    });

    // 6. Store local token reference
    localStorage.setItem("operatsi_fcm_token", token);

    return {
      success: true,
      token,
      permission,
    };
  } catch (err: any) {
    console.error("[FCM] enablePushNotifications error:", err);
    return {
      success: false,
      error: err.message || "Failed to initialize push messaging",
      permission: Notification.permission,
    };
  }
}

/**
 * Disable push notifications and unregister token from backend
 */
export async function disablePushNotifications(uid: string): Promise<boolean> {
  const token = typeof window !== "undefined" ? localStorage.getItem("operatsi_fcm_token") : null;
  if (token && uid) {
    await unregisterDeviceToken(uid, token);
    localStorage.removeItem("operatsi_fcm_token");
  }
  return true;
}

/**
 * Attach foreground notification listener
 */
export function setupForegroundMessageListener(onNotification: (payload: any) => void): (() => void) | null {
  const messaging = getClientMessaging();
  if (!messaging) return null;

  try {
    return onMessage(messaging, (payload) => {
      onNotification(payload);
    });
  } catch (err) {
    console.warn("[FCM] onMessage setup error:", err);
    return null;
  }
}
