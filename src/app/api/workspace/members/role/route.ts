import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  requireWorkspacePermission,
  recordWorkspaceAudit,
  DEFAULT_WORKSPACE_ID,
} from "@/lib/serverWorkspaceAuth";
import {
  WorkspaceRole,
  canManageMemberRole,
  WorkspaceMember,
} from "@/lib/workspaceMembers";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, newRole, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: "targetUserId and newRole are required" }, { status: 400 });
    }

    const authResult = await requireWorkspacePermission(req, "members.role.update", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // Fetch target member document
    const memberRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("members")
      .doc(targetUserId);

    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: "Target member not found in workspace" }, { status: 404 });
    }

    const memberData = memberDoc.data() as WorkspaceMember;
    const currentRole = memberData.role;

    if (currentRole === newRole) {
      return NextResponse.json({ success: true, message: "Member already has this role" });
    }

    // Verify privilege escalation protection
    if (!canManageMemberRole(actor.role, currentRole, newRole as WorkspaceRole)) {
      return NextResponse.json(
        { error: `Forbidden: role '${actor.role}' cannot change role from '${currentRole}' to '${newRole}'` },
        { status: 403 }
      );
    }

    // Protect last owner check
    if (currentRole === "owner") {
      const ownersSnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("members")
        .where("role", "==", "owner")
        .get();

      if (ownersSnap.size <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last remaining workspace owner. Transfer ownership first." },
          { status: 400 }
        );
      }
    }

    // Update role
    await memberRef.update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Record audit event
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetUserId,
      targetEmail: memberData.email,
      action: "member_role_changed",
      previousValue: currentRole,
      newValue: newRole,
    });

    // Dispatch real in-app notification to the target user
    try {
      const notifRef = adminDb
        .collection("users")
        .doc(targetUserId)
        .collection("notifications")
        .doc();

      await notifRef.set({
        schemaVersion: 1,
        type: "role_updated",
        category: "security",
        title: "Workspace Role Updated",
        body: `Your role in the workspace was updated from ${currentRole} to ${newRole} by ${actor.displayName}.`,
        workspaceId,
        actorId: actor.uid,
        actorName: actor.displayName,
        resourceType: "workspace",
        resourceId: workspaceId,
        actionUrl: "/settings",
        priority: "high",
        deduplicationKey: `${targetUserId}_role_change_${Date.now()}`,
        createdAt: FieldValue.serverTimestamp(),
        readAt: null,
        archivedAt: null,
      });
    } catch (notifErr) {
      console.warn("[API Member Role] Could not notify user:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Role for ${memberData.name || memberData.email} updated to ${newRole}.`,
      targetUserId,
      newRole,
    });
  } catch (err: any) {
    console.error("[API Member Role] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update member role" },
      { status: 500 }
    );
  }
}
