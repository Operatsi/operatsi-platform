import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { uid, fcmToken, metadata } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing or invalid recipient UID" }, { status: 400 });
    }

    if (!fcmToken || typeof fcmToken !== "string") {
      return NextResponse.json({ error: "Missing or invalid FCM registration token" }, { status: 400 });
    }

    // Generate safe deterministic device ID based on token hash
    const deviceId = crypto.createHash("sha256").update(fcmToken).digest("hex").slice(0, 32);

    const deviceDocRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("devices")
      .doc(deviceId);

    const deviceRecord = {
      uid,
      deviceId,
      fcmToken,
      deviceMetadata: {
        browser: metadata?.browser || "Web Browser",
        os: metadata?.os || "Unknown OS",
        deviceType: metadata?.deviceType || "Desktop",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1",
      },
      registeredAt: FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
      revokedAt: null,
    };

    await deviceDocRef.set(deviceRecord, { merge: true });

    return NextResponse.json({ success: true, deviceId }, { status: 200 });
  } catch (err: any) {
    console.error("[API Notifications Devices] Registration error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to register push device" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { uid, fcmToken } = await req.json();

    if (!uid || !fcmToken) {
      return NextResponse.json({ error: "Missing uid or fcmToken" }, { status: 400 });
    }

    const deviceId = crypto.createHash("sha256").update(fcmToken).digest("hex").slice(0, 32);

    const deviceDocRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("devices")
      .doc(deviceId);

    await deviceDocRef.update({
      revokedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, revoked: true }, { status: 200 });
  } catch (err: any) {
    console.error("[API Notifications Devices] Revocation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to revoke push device" },
      { status: 500 }
    );
  }
}
