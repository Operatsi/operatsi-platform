import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendNotificationEmail } from "@/lib/emailService";
import { NotificationCategory, NotificationPriority } from "@/lib/notifications";

// Helper to determine if current time is within user's configured Quiet Hours
function isInQuietHours(quietHours: { enabled: boolean; startTime: string; endTime: string; timezone: string }): boolean {
  if (!quietHours || !quietHours.enabled) return false;
  try {
    const tz = quietHours.timezone || "UTC";
    const now = new Date();
    // Get local time in user's timezone
    const userLocalStr = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false });
    const [currH, currM] = userLocalStr.split(":").map(Number);
    const currMinutes = currH * 60 + currM;

    const [startH, startM] = quietHours.startTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;

    const [endH, endM] = quietHours.endTime.split(":").map(Number);
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
      return currMinutes >= startMinutes && currMinutes < endMinutes;
    } else {
      // Wraps overnight (e.g. 22:00 to 08:00)
      return currMinutes >= startMinutes || currMinutes < endMinutes;
    }
  } catch (e) {
    console.warn("[QuietHours] Error calculating timezone window:", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientUid,
      recipientEmail,
      category = "tasks",
      type = "system_event",
      title,
      body: contentBody,
      priority = "normal",
      resourceType = "task",
      resourceId = "",
      actionUrl = "/inbox",
      actorName = "OperatSI System",
      workspaceId = "ws_primary",
    } = body;

    if (!recipientUid || typeof recipientUid !== "string") {
      return NextResponse.json({ error: "recipientUid is required" }, { status: 400 });
    }

    if (!title || !contentBody) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    // 1. Fetch user's notification preferences from Firestore
    const prefsDoc = await adminDb
      .collection("users")
      .doc(recipientUid)
      .collection("settings")
      .doc("notifications")
      .get();

    const prefs = prefsDoc.exists ? prefsDoc.data() : null;

    const inAppEnabled = prefs?.inAppEnabled ?? true;
    const pushEnabled = prefs?.pushEnabled ?? false;
    const emailEnabled = prefs?.emailEnabled ?? true;

    // Check category specific permissions (security is always mandatory)
    const catPrefs = category === "security"
      ? { inApp: true, email: true, push: true }
      : prefs?.categoryPreferences?.[category] ?? { inApp: true, email: true, push: true };

    const isUrgent = priority === "urgent" || category === "security";
    const quietActive = !isUrgent && prefs?.quietHours ? isInQuietHours(prefs.quietHours) : false;

    // 2. Generate and Persist In-App Notification if enabled
    let notificationId: string | null = null;
    if (inAppEnabled && catPrefs.inApp) {
      const sanitizedActionUrl = actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`;

      const notifRef = adminDb
        .collection("users")
        .doc(recipientUid)
        .collection("notifications")
        .doc();

      notificationId = notifRef.id;

      await notifRef.set({
        schemaVersion: 1,
        type,
        category: category as NotificationCategory,
        title,
        body: contentBody,
        workspaceId,
        actorId: "system",
        actorName,
        resourceType,
        resourceId,
        actionUrl: sanitizedActionUrl,
        priority: priority as NotificationPriority,
        deduplicationKey: `${recipientUid}_${type}_${resourceId}_${Date.now()}`,
        createdAt: FieldValue.serverTimestamp(),
        readAt: null,
        archivedAt: null,
      });
    }

    // 3. Dispatch Browser FCM Push if permitted & not in quiet hours
    let pushDispatched = false;
    let pushTokensCount = 0;
    if (pushEnabled && catPrefs.push && !quietActive) {
      try {
        const devicesSnap = await adminDb
          .collection("users")
          .doc(recipientUid)
          .collection("devices")
          .where("revokedAt", "==", null)
          .get();

        const tokens: string[] = [];
        devicesSnap.forEach((doc) => {
          const t = doc.data().fcmToken;
          if (t && typeof t === "string") tokens.push(t);
        });

        pushTokensCount = tokens.length;

        if (tokens.length > 0) {
          const pushPayload = {
            tokens,
            notification: {
              title: `[OperatSI] ${title}`,
              body: contentBody,
            },
            data: {
              notificationId: notificationId || "",
              actionUrl: actionUrl || "/inbox",
              category,
              priority,
            },
            webpush: {
              fcmOptions: {
                link: actionUrl.startsWith("http") ? actionUrl : `https://operatsi.com${actionUrl}`,
              },
              notification: {
                icon: "/icon.png",
                badge: "/icon.png",
                tag: `operatsi_${category}`,
                requireInteraction: priority === "urgent",
              },
            },
          };

          const response = await adminMessaging.sendEachForMulticast(pushPayload);
          pushDispatched = response.successCount > 0;

          // Cleanup obsolete or unregistered tokens
          response.responses.forEach(async (res, idx) => {
            if (!res.success && res.error?.code === "messaging/registration-token-not-registered") {
              const staleToken = tokens[idx];
              const querySnap = await adminDb
                .collection("users")
                .doc(recipientUid)
                .collection("devices")
                .where("fcmToken", "==", staleToken)
                .get();
              querySnap.forEach((d) => d.ref.delete());
            }
          });
        }
      } catch (pushErr) {
        console.warn("[API Notifications Events] Push dispatch skipped or failed:", pushErr);
      }
    }

    // 4. Dispatch Email if permitted & recipient email known & not in quiet hours
    let emailDispatched = false;
    let resolvedEmail = recipientEmail;

    if (!resolvedEmail) {
      try {
        const userDoc = await adminDb.collection("users").doc(recipientUid).get();
        if (userDoc.exists) {
          resolvedEmail = userDoc.data()?.email;
        }
      } catch {
        // Fallback
      }
    }

    if (emailEnabled && catPrefs.email && resolvedEmail && !quietActive) {
      try {
        const emailResult = await sendNotificationEmail({
          toEmail: resolvedEmail,
          recipientName: actorName !== "OperatSI System" ? recipientEmail?.split("@")[0] : undefined,
          title,
          body: contentBody,
          category,
          priority,
          actionUrl,
        });
        emailDispatched = emailResult.success;
      } catch (emailErr) {
        console.warn("[API Notifications Events] Email dispatch failed:", emailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        notificationId,
        inAppCreated: Boolean(notificationId),
        pushDispatched,
        pushDevicesTargeted: pushTokensCount,
        emailDispatched,
        quietHoursSuppressed: quietActive,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[API Notifications Events] Event dispatch fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process notification event" },
      { status: 500 }
    );
  }
}
