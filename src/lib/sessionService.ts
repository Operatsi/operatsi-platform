import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface SessionRecord {
  id: string;
  browser: string;
  os: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  ipAddress: string;
  location: string;
  createdAt: Timestamp | { seconds: number; nanoseconds: number } | null;
  lastSeenAt: Timestamp | { seconds: number; nanoseconds: number } | null;
  revoked: boolean;
  revokedAt?: Timestamp | { seconds: number; nanoseconds: number } | null;
  revocationReason?: string;
  authMethod?: string;
}

export interface SecurityEventRecord {
  id: string;
  eventType:
    | "signin_success"
    | "signin_failed"
    | "password_changed"
    | "email_changed"
    | "phone_verified"
    | "provider_linked"
    | "provider_unlinked"
    | "session_revoked"
    | "logout_other_devices"
    | "logout_all_devices"
    | "suspicious_activity";
  eventTitle: string;
  status: "success" | "warning" | "error";
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | null;
  device?: string;
  ipAddress?: string;
  location?: string;
  details?: string;
}

export interface SecurityPreferences {
  newSignInAlerts: boolean;
  passwordChangeAlerts: boolean;
  providerLinkingAlerts: boolean;
  sessionRevocationAlerts: boolean;
  updatedAt?: Timestamp | null;
}

const SESSION_STORAGE_KEY = "operatsi_session_id";
let lastHeartbeatTime = 0;

/**
 * Returns or generates a unique, persistent session identifier for this browser instance.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Fetches server-inspected device and IP metadata from /api/auth/session
 */
export async function fetchDeviceMetadata(): Promise<{
  browser: string;
  os: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  ipAddress: string;
  location: string;
}> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "same-origin" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Failed to fetch server device metadata:", err);
  }

  // Graceful fallback if offline or request fails
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown Client";
  return {
    browser: ua.includes("Chrome") ? "Google Chrome" : ua.includes("Firefox") ? "Mozilla Firefox" : "Web Browser",
    os: ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iOS") ? "iOS" : "Unknown OS",
    deviceType: /mobile/i.test(ua) ? "Mobile" : "Desktop",
    ipAddress: "127.0.0.1",
    location: "Location unavailable",
  };
}

/**
 * Registers or updates the active application session in Firestore.
 */
export async function registerSession(uid: string, authMethod?: string): Promise<string> {
  if (!uid || typeof window === "undefined") return "";
  const sessionId = getOrCreateSessionId();
  const metadata = await fetchDeviceMetadata();

  const sessionRef = doc(db, "users", uid, "sessions", sessionId);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    await setDoc(sessionRef, {
      id: sessionId,
      browser: metadata.browser,
      os: metadata.os,
      deviceType: metadata.deviceType,
      ipAddress: metadata.ipAddress,
      location: metadata.location,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      revoked: false,
      authMethod: authMethod || "email",
    });

    // Record login audit event
    await logSecurityEvent(uid, {
      eventType: "signin_success",
      eventTitle: "Successful Application Sign-in",
      status: "success",
      device: `${metadata.browser} on ${metadata.os}`,
      ipAddress: metadata.ipAddress,
      location: metadata.location,
      details: `Established active session: ${sessionId.substring(0, 8)}...`,
    });
  } else {
    // If it exists but was previously revoked in this storage, unrevoke or renew
    const data = snap.data();
    if (data.revoked) {
      // Re-initialize with new ID to prevent reusing a revoked session token
      const newSessionId = crypto.randomUUID ? crypto.randomUUID() : "sess_" + Date.now();
      localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      return registerSession(uid, authMethod);
    } else {
      await updateDoc(sessionRef, {
        lastSeenAt: serverTimestamp(),
        ipAddress: metadata.ipAddress,
        location: metadata.location,
      });
    }
  }

  return sessionId;
}

/**
 * Throttled heartbeat to update last seen timestamp (at most once every 60 seconds).
 */
export async function updateSessionHeartbeat(uid: string): Promise<void> {
  if (!uid || typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastHeartbeatTime < 60000) return;
  lastHeartbeatTime = now;

  try {
    const sessionId = getOrCreateSessionId();
    const sessionRef = doc(db, "users", uid, "sessions", sessionId);
    await updateDoc(sessionRef, {
      lastSeenAt: serverTimestamp(),
    });
  } catch (err) {
    // Non-critical, ignore
  }
}

/**
 * Revokes a specific session by ID.
 */
export async function revokeSession(uid: string, sessionId: string, reason = "Terminated by user"): Promise<void> {
  if (!uid || !sessionId) return;
  const sessionRef = doc(db, "users", uid, "sessions", sessionId);
  await updateDoc(sessionRef, {
    revoked: true,
    revokedAt: serverTimestamp(),
    revocationReason: reason,
  });

  const metadata = await fetchDeviceMetadata();
  await logSecurityEvent(uid, {
    eventType: "session_revoked",
    eventTitle: "Session Revoked",
    status: "warning",
    device: `${metadata.browser} on ${metadata.os}`,
    ipAddress: metadata.ipAddress,
    location: metadata.location,
    details: `Session ${sessionId.substring(0, 8)}... was terminated.`,
  });
}

/**
 * Revokes all sessions except the current active session.
 */
export async function revokeOtherSessions(uid: string, currentSessionId: string): Promise<number> {
  if (!uid) return 0;
  const sessionsCol = collection(db, "users", uid, "sessions");
  const q = query(sessionsCol, where("revoked", "==", false));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  let revokedCount = 0;

  snap.forEach((d) => {
    if (d.id !== currentSessionId) {
      batch.update(d.ref, {
        revoked: true,
        revokedAt: serverTimestamp(),
        revocationReason: "Logged out from other devices",
      });
      revokedCount++;
    }
  });

  if (revokedCount > 0) {
    await batch.commit();

    const metadata = await fetchDeviceMetadata();
    await logSecurityEvent(uid, {
      eventType: "logout_other_devices",
      eventTitle: "Logged Out Other Devices",
      status: "warning",
      device: `${metadata.browser} on ${metadata.os}`,
      ipAddress: metadata.ipAddress,
      location: metadata.location,
      details: `Revoked ${revokedCount} active session(s) on other devices.`,
    });
  }

  return revokedCount;
}

/**
 * Revokes all sessions across all devices.
 */
export async function revokeAllSessions(uid: string): Promise<number> {
  if (!uid) return 0;
  const sessionsCol = collection(db, "users", uid, "sessions");
  const q = query(sessionsCol, where("revoked", "==", false));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  let revokedCount = 0;

  snap.forEach((d) => {
    batch.update(d.ref, {
      revoked: true,
      revokedAt: serverTimestamp(),
      revocationReason: "Logged out of all devices",
    });
    revokedCount++;
  });

  if (revokedCount > 0) {
    await batch.commit();

    const metadata = await fetchDeviceMetadata();
    await logSecurityEvent(uid, {
      eventType: "logout_all_devices",
      eventTitle: "Logged Out All Devices",
      status: "warning",
      device: `${metadata.browser} on ${metadata.os}`,
      ipAddress: metadata.ipAddress,
      location: metadata.location,
      details: `Terminated all ${revokedCount} active session(s).`,
    });
  }

  return revokedCount;
}

/**
 * Appends a verified security audit event to the user's security log.
 */
export async function logSecurityEvent(
  uid: string,
  event: Omit<SecurityEventRecord, "id" | "timestamp">
): Promise<void> {
  if (!uid) return;
  try {
    const eventsCol = collection(db, "users", uid, "security_events");
    const eventDoc = doc(eventsCol);
    await setDoc(eventDoc, {
      ...event,
      id: eventDoc.id,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to record security audit event:", err);
  }
}

/**
 * Fetches user security notification preferences.
 */
export async function getSecurityPreferences(uid: string): Promise<SecurityPreferences> {
  const defaultPrefs: SecurityPreferences = {
    newSignInAlerts: true,
    passwordChangeAlerts: true,
    providerLinkingAlerts: true,
    sessionRevocationAlerts: true,
  };

  if (!uid) return defaultPrefs;
  try {
    const ref = doc(db, "users", uid, "security_preferences", "config");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...defaultPrefs, ...(snap.data() as Partial<SecurityPreferences>) };
    }
  } catch (err) {
    console.warn("Failed to load security preferences:", err);
  }
  return defaultPrefs;
}

/**
 * Updates user security notification preferences.
 */
export async function updateSecurityPreferences(
  uid: string,
  prefs: Partial<SecurityPreferences>
): Promise<void> {
  if (!uid) return;
  const ref = doc(db, "users", uid, "security_preferences", "config");
  await setDoc(
    ref,
    {
      ...prefs,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
