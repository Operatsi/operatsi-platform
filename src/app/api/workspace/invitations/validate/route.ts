import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { hashToken } from "@/lib/invitationEmail";
import { WorkspaceInvitation } from "@/lib/workspaceMembers";
import { DEFAULT_WORKSPACE_NAME } from "@/lib/serverWorkspaceAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json(
        { valid: false, error: "Invalid invitation link." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    // Look up token in global index
    const tokenDoc = await adminDb
      .collection("workspace_invitations_by_token")
      .doc(tokenHash)
      .get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { valid: false, error: "This invitation link is invalid or has expired." },
        { status: 404 }
      );
    }

    const tokenData = tokenDoc.data();
    const { workspaceId, invitationId, expiresAt, status } = tokenData || {};

    if (status !== "pending") {
      return NextResponse.json(
        { valid: false, error: "This invitation is no longer active." },
        { status: 410 }
      );
    }

    // Check expiration
    const expiresMillis = expiresAt?.seconds ? expiresAt.seconds * 1000 : new Date(expiresAt).getTime();
    if (expiresMillis < Date.now()) {
      return NextResponse.json(
        { valid: false, error: "This invitation link has expired." },
        { status: 410 }
      );
    }

    // Fetch workspace invitation details
    const inviteDoc = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .doc(invitationId)
      .get();

    if (!inviteDoc.exists) {
      return NextResponse.json(
        { valid: false, error: "Invitation record could not be found." },
        { status: 404 }
      );
    }

    const inviteData = inviteDoc.data() as WorkspaceInvitation;
    if (inviteData.status !== "pending") {
      return NextResponse.json(
        { valid: false, error: `This invitation has already been ${inviteData.status}.` },
        { status: 410 }
      );
    }

    // Fetch workspace name
    const wsDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
    const workspaceName = wsDoc.exists ? wsDoc.data()?.name || DEFAULT_WORKSPACE_NAME : DEFAULT_WORKSPACE_NAME;

    return NextResponse.json({
      valid: true,
      workspaceId,
      workspaceName,
      invitedEmail: inviteData.invitedEmail,
      role: inviteData.role,
      inviterName: inviteData.inviterName,
      message: inviteData.message || null,
      expiresAt: inviteData.expiresAt,
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations Validate] Error:", err);
    return NextResponse.json(
      { valid: false, error: "Unable to validate invitation." },
      { status: 500 }
    );
  }
}
