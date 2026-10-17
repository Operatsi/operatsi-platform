import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  requireWorkspacePermission,
  recordWorkspaceAudit,
  DEFAULT_WORKSPACE_ID,
} from "@/lib/serverWorkspaceAuth";
import {
  canRemoveMember,
  WorkspaceMember,
} from "@/lib/workspaceMembers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const authResult = await requireWorkspacePermission(req, "members.remove", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // Check if target member exists
    const memberRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("members")
      .doc(targetUserId);

    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
    }

    const memberData = memberDoc.data() as WorkspaceMember;

    // Check authorization rules
    if (!canRemoveMember(actor.role, memberData.role)) {
      return NextResponse.json(
        { error: `Forbidden: role '${actor.role}' cannot remove member with role '${memberData.role}'` },
        { status: 403 }
      );
    }

    // Protect last owner check
    if (memberData.role === "owner") {
      const ownersSnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("members")
        .where("role", "==", "owner")
        .get();

      if (ownersSnap.size <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last remaining workspace owner." },
          { status: 400 }
        );
      }
    }

    // Delete member document
    await memberRef.delete();

    // Record audit event
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetUserId,
      targetEmail: memberData.email,
      action: "member_removed",
      previousValue: memberData.role,
      newValue: "removed",
    });

    // Notify user of membership revocation
    try {
      const notifRef = adminDb
        .collection("users")
        .doc(targetUserId)
        .collection("notifications")
        .doc();

      await notifRef.set({
        schemaVersion: 1,
        type: "membership_revoked",
        category: "security",
        title: "Workspace Access Removed",
        body: `You were removed from workspace ${workspaceId} by ${actor.displayName}.`,
        workspaceId,
        actorId: actor.uid,
        actorName: actor.displayName,
        resourceType: "workspace",
        resourceId: workspaceId,
        actionUrl: "/settings",
        priority: "urgent",
        deduplicationKey: `${targetUserId}_membership_revoked_${Date.now()}`,
        createdAt: FieldValue.serverTimestamp(),
        readAt: null,
        archivedAt: null,
      });
    } catch (notifErr) {
      console.warn("[API Remove Member] Could not notify target user:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Member ${memberData.name || memberData.email} successfully removed from workspace.`,
      targetUserId,
    });
  } catch (err: any) {
    console.error("[API Remove Member] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to remove workspace member" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
