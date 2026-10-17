import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { uid, preferences } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing or invalid recipient UID" }, { status: 400 });
    }

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "Missing or invalid preferences payload" }, { status: 400 });
    }

    // Schema validation and enforcement of mandatory security category
    const cleanPrefs = {
      inAppEnabled: Boolean(preferences.inAppEnabled ?? true),
      pushEnabled: Boolean(preferences.pushEnabled ?? false),
      emailEnabled: Boolean(preferences.emailEnabled ?? true),
      categoryPreferences: {
        ...(preferences.categoryPreferences || {}),
        // Security is strictly non-negotiable / mandatory
        security: { inApp: true, email: true, push: true },
      },
      quietHours: {
        enabled: Boolean(preferences.quietHours?.enabled ?? false),
        startTime: preferences.quietHours?.startTime || "22:00",
        endTime: preferences.quietHours?.endTime || "08:00",
        timezone: preferences.quietHours?.timezone || "UTC",
      },
      digestFrequency: ["immediate", "daily", "weekly"].includes(preferences.digestFrequency)
        ? preferences.digestFrequency
        : "immediate",
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = adminDb.collection("users").doc(uid).collection("settings").doc("notifications");
    await docRef.set(cleanPrefs, { merge: true });

    return NextResponse.json({ success: true, preferences: cleanPrefs }, { status: 200 });
  } catch (err: any) {
    console.error("[API Notifications Preferences] Error saving preferences:", err);
    return NextResponse.json(
      { error: err.message || "Failed to persist preferences" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
    }

    const docRef = adminDb.collection("users").doc(uid).collection("settings").doc("notifications");
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ preferences: null }, { status: 200 });
    }

    return NextResponse.json({ preferences: snapshot.data() }, { status: 200 });
  } catch (err: any) {
    console.error("[API Notifications Preferences] Error fetching preferences:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
