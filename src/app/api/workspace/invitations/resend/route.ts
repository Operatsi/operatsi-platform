import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  requireWorkspacePermission,
  recordWorkspaceAudit,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_WORKSPACE_NAME,
} from "@/lib/serverWorkspaceAuth";
import { WorkspaceInvitation } from "@/lib/workspaceMembers";
import {
  generateSecureToken,
  sendWorkspaceInvitationEmail,
} from "@/lib/invitationEmail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
    }

    const authResult = await requireWorkspacePermission(req, "invitations.resend", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // Fetch existing invitation
    const invitationRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .doc(invitationId);

    const inviteDoc = await invitationRef.get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: "Invitation record not found" }, { status: 404 });
    }

    const inviteData = inviteDoc.data() as WorkspaceInvitation;

    if (inviteData.status === "accepted") {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 400 });
    }

    // 1. Invalidate previous token hash in global lookup
    if (inviteData.tokenHash) {
      await adminDb
        .collection("workspace_invitations_by_token")
        .doc(inviteData.tokenHash)
        .delete()
        .catch(() => {});
    }

    // 2. Generate fresh secure token & hash
    const { rawToken, tokenHash } = generateSecureToken();
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiresAt = Timestamp.fromDate(expirationDate);

    // Fetch workspace name
    const wsDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
    const workspaceName = wsDoc.exists ? wsDoc.data()?.name || DEFAULT_WORKSPACE_NAME : DEFAULT_WORKSPACE_NAME;

    // 3. Dispatch fresh email
    const emailResult = await sendWorkspaceInvitationEmail({
      toEmail: inviteData.invitedEmail,
      inviterName: actor.displayName,
      workspaceName,
      role: inviteData.role,
      rawToken,
      expiresAt: expirationDate,
      customMessage: inviteData.message,
      appBaseUrl: req.nextUrl.origin,
    });

    const deliveryStatus = emailResult.success ? "delivered" : "failed";

    // 4. Update invitation record
    await invitationRef.update({
      tokenHash,
      status: "pending",
      expiresAt,
      deliveryStatus,
      deliveryError: emailResult.error || null,
      deliveryMessageId: emailResult.messageId || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5. Register new token hash in reverse lookup
    await adminDb
      .collection("workspace_invitations_by_token")
      .doc(tokenHash)
      .set({
        workspaceId,
        invitationId,
        tokenHash,
        invitedEmailNormalized: inviteData.invitedEmailNormalized,
        expiresAt,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });

    // 6. Record audit log
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetEmail: inviteData.invitedEmail,
      action: "invitation_resent",
      newValue: `Fresh token issued. Delivery: ${deliveryStatus}`,
    });

    return NextResponse.json({
      success: true,
      message: `Fresh invitation email dispatched to ${inviteData.invitedEmail}`,
      deliveryStatus,
      deliveryError: emailResult.error || null,
      inviteUrl: emailResult.inviteUrl,
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations Resend] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to resend workspace invitation" },
      { status: 500 }
    );
  }
}
