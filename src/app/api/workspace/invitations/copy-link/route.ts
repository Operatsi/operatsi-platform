import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  requireWorkspacePermission,
  recordWorkspaceAudit,
  DEFAULT_WORKSPACE_ID,
} from "@/lib/serverWorkspaceAuth";
import { WorkspaceInvitation } from "@/lib/workspaceMembers";
import { generateSecureToken } from "@/lib/invitationEmail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId, workspaceId = DEFAULT_WORKSPACE_ID } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
    }

    const authResult = await requireWorkspacePermission(req, "members.invite", workspaceId);
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
    if (inviteData.status !== "pending") {
      return NextResponse.json({ error: "Cannot copy link for an inactive invitation" }, { status: 400 });
    }

    // Invalidate old token hash
    if (inviteData.tokenHash) {
      await adminDb
        .collection("workspace_invitations_by_token")
        .doc(inviteData.tokenHash)
        .delete()
        .catch(() => {});
    }

    // Generate fresh secure token
    const { rawToken, tokenHash } = generateSecureToken();
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiresAt = Timestamp.fromDate(expirationDate);

    // Update invitation
    await invitationRef.update({
      tokenHash,
      expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Store in global token index
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

    // Record audit event
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetEmail: inviteData.invitedEmail,
      action: "invitation_resent",
      newValue: "Admin rotated token to copy secure invitation link",
    });

    const origin = (
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      "https://operatsi.com"
    ).replace(/\/$/, "");

    const inviteUrl = `${origin}/invite/accept?token=${encodeURIComponent(rawToken)}`;

    return NextResponse.json({
      success: true,
      inviteUrl,
      message: "Secure invitation link generated.",
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations Copy Link] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate invitation link" },
      { status: 500 }
    );
  }
}
