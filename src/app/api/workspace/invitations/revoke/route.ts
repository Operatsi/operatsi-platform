import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  requireWorkspacePermission,
  recordWorkspaceAudit,
  DEFAULT_WORKSPACE_ID,
} from "@/lib/serverWorkspaceAuth";
import { WorkspaceInvitation } from "@/lib/workspaceMembers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
    }

    const authResult = await requireWorkspacePermission(req, "invitations.revoke", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // Fetch invitation
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

    if (inviteData.status === "accepted") {
      return NextResponse.json({ error: "Cannot revoke an already accepted invitation" }, { status: 400 });
    }

    // 1. Invalidate reverse token lookup
    if (inviteData.tokenHash) {
      await adminDb
        .collection("workspace_invitations_by_token")
        .doc(inviteData.tokenHash)
        .delete()
        .catch(() => {});
    }

    // 2. Mark status revoked
    await invitationRef.update({
      status: "revoked",
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Record audit event
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetEmail: inviteData.invitedEmail,
      action: "invitation_revoked",
      previousValue: inviteData.status,
      newValue: "revoked",
    });

    return NextResponse.json({
      success: true,
      message: `Invitation for ${inviteData.invitedEmail} has been permanently revoked.`,
      invitationId,
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations Revoke] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
