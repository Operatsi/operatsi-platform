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
  canAssignRole,
  WorkspaceInvitation,
} from "@/lib/workspaceMembers";
import {
  updatePostgresInvitationRole,
  recordPostgresSecurityAudit,
} from "@/lib/supabase/workspaceService";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId, newRole, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!invitationId || !newRole) {
      return NextResponse.json({ error: "invitationId and newRole are required" }, { status: 400 });
    }

    const authResult = await requireWorkspacePermission(req, "invitations.change_role", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    if (!canAssignRole(actor.role, newRole as WorkspaceRole)) {
      return NextResponse.json(
        { error: `Forbidden: role '${actor.role}' cannot assign role '${newRole}'` },
        { status: 403 }
      );
    }

    const invitationRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .doc(invitationId);

    const inviteDoc = await invitationRef.get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const inviteData = inviteDoc.data() as WorkspaceInvitation;
    if (inviteData.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot change role on an invitation with status '${inviteData.status}'` },
        { status: 400 }
      );
    }

    const oldRole = inviteData.role;

    // 1. Update in Firestore
    await invitationRef.update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Synchronize to PostgreSQL
    try {
      await updatePostgresInvitationRole(workspaceId, invitationId, newRole as WorkspaceRole);
    } catch (pgErr) {
      console.warn("[API Workspace Invitations Change Role] PostgreSQL sync error:", pgErr);
    }

    // 3. Record audit event in Firestore
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetEmail: inviteData.invitedEmail,
      action: "invitation_role_changed",
      previousValue: oldRole,
      newValue: newRole,
    });

    // 4. Record audit event in PostgreSQL
    try {
      await recordPostgresSecurityAudit({
        workspaceId,
        actorUserId: actor.uid,
        actorName: actor.displayName,
        actorEmail: actor.email,
        targetEmail: inviteData.invitedEmail,
        action: "invitation_role_changed",
        previousValue: oldRole,
        newValue: newRole,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      });
    } catch (pgAuditErr) {
      console.warn("[API Workspace Invitations Change Role] PostgreSQL audit error:", pgAuditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Invitation role for ${inviteData.invitedEmail} updated to ${newRole}.`,
      invitationId,
      newRole,
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations Change Role] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update invitation role" },
      { status: 500 }
    );
  }
}
