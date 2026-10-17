import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  requireWorkspacePermission,
  recordWorkspaceAudit,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_WORKSPACE_NAME,
} from "@/lib/serverWorkspaceAuth";
import {
  WorkspaceRole,
  canAssignRole,
  isValidEmail,
  normalizeEmail,
  WorkspaceInvitation,
} from "@/lib/workspaceMembers";
import {
  generateSecureToken,
  sendWorkspaceInvitationEmail,
} from "@/lib/invitationEmail";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || DEFAULT_WORKSPACE_ID;

    const authResult = await requireWorkspacePermission(req, "members.read", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const invitationsSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .orderBy("createdAt", "desc")
      .get();

    const invitations: Omit<WorkspaceInvitation, "tokenHash">[] = [];
    const now = Date.now();

    for (const doc of invitationsSnap.docs) {
      const data = doc.data() as WorkspaceInvitation;
      let status = data.status;

      // Auto-mark expired if past expiresAt
      const expiresMillis = data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : new Date(data.expiresAt).getTime();
      if (status === "pending" && expiresMillis < now) {
        status = "expired";
        // Update in background
        doc.ref.update({ status: "expired" }).catch(() => {});
      }

      invitations.push({
        id: doc.id,
        workspaceId: data.workspaceId,
        invitedEmail: data.invitedEmail,
        invitedEmailNormalized: data.invitedEmailNormalized,
        role: data.role,
        invitedBy: data.invitedBy,
        inviterName: data.inviterName,
        status,
        message: data.message || "",
        expiresAt: data.expiresAt,
        deliveryStatus: data.deliveryStatus,
        deliveryError: data.deliveryError || null,
        deliveryMessageId: data.deliveryMessageId || null,
        acceptedBy: data.acceptedBy || null,
        acceptedAt: data.acceptedAt || null,
        revokedAt: data.revokedAt || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    }

    return NextResponse.json({
      success: true,
      workspaceId,
      invitations,
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve workspace invitations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      role = "member",
      message = "",
      workspaceId = DEFAULT_WORKSPACE_ID,
    } = body;

    // 1. Email format validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid work email address" }, { status: 400 });
    }

    const emailNormalized = normalizeEmail(email);

    // 2. Authorization check: does actor have members.invite permission?
    const authResult = await requireWorkspacePermission(req, "members.invite", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // 3. Verify actor is authorized to assign this role
    if (!canAssignRole(actor.role, role as WorkspaceRole)) {
      return NextResponse.json(
        { error: `Forbidden: role '${actor.role}' cannot assign role '${role}'` },
        { status: 403 }
      );
    }

    // 4. Check if recipient is already an active member of this workspace
    const existingMemberSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("members")
      .where("emailNormalized", "==", emailNormalized)
      .limit(1)
      .get();

    if (!existingMemberSnap.empty) {
      return NextResponse.json(
        { error: "A team member with this email is already an active member of this workspace" },
        { status: 400 }
      );
    }

    // 5. Check if there is already an active pending invitation for this email
    const existingInviteSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .where("invitedEmailNormalized", "==", emailNormalized)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingInviteSnap.empty) {
      const existingDoc = existingInviteSnap.docs[0];
      const existingData = existingDoc.data() as WorkspaceInvitation;
      const expiresMillis = existingData.expiresAt?.seconds
        ? existingData.expiresAt.seconds * 1000
        : new Date(existingData.expiresAt).getTime();

      if (expiresMillis > Date.now()) {
        return NextResponse.json(
          {
            error: "An active invitation has already been sent to this email. You can resend or revoke it from the Pending Invitations list.",
          },
          { status: 409 }
        );
      }
    }

    // 6. Generate cryptographically secure token & SHA-256 hash
    const { rawToken, tokenHash } = generateSecureToken();

    // 7. Calculate expiration (7 days from now)
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiresAt = Timestamp.fromDate(expirationDate);

    // 8. Create pending invitation record in Firestore
    const invitationRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .doc();

    const invitationId = invitationRef.id;

    // Fetch workspace name
    const wsDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
    const workspaceName = wsDoc.exists ? wsDoc.data()?.name || DEFAULT_WORKSPACE_NAME : DEFAULT_WORKSPACE_NAME;

    // 9. Dispatch real email via nodemailer
    const emailResult = await sendWorkspaceInvitationEmail({
      toEmail: email.trim(),
      inviterName: actor.displayName,
      workspaceName,
      role,
      rawToken,
      expiresAt: expirationDate,
      customMessage: message.trim() || undefined,
      appBaseUrl: req.nextUrl.origin,
    });

    const deliveryStatus = emailResult.success ? "delivered" : "failed";

    // 10. Persist invitation record
    const invitationData: WorkspaceInvitation = {
      id: invitationId,
      workspaceId,
      invitedEmail: email.trim(),
      invitedEmailNormalized: emailNormalized,
      role: role as WorkspaceRole,
      invitedBy: actor.uid,
      inviterName: actor.displayName,
      tokenHash,
      status: "pending",
      message: message.trim() || undefined,
      expiresAt,
      deliveryStatus,
      deliveryError: emailResult.error || null,
      deliveryMessageId: emailResult.messageId || null,
      acceptedBy: null,
      acceptedAt: null,
      revokedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await invitationRef.set(invitationData);

    // 11. Store reverse token hash lookup for fast single-use token verification
    await adminDb
      .collection("workspace_invitations_by_token")
      .doc(tokenHash)
      .set({
        workspaceId,
        invitationId,
        tokenHash,
        invitedEmailNormalized: emailNormalized,
        expiresAt,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });

    // 12. Record audit log
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: actor.displayName,
      actorEmail: actor.email,
      targetEmail: email.trim(),
      action: "invitation_created",
      newValue: `Role: ${role}, Delivery: ${deliveryStatus}`,
    });

    return NextResponse.json({
      success: true,
      message: `Invitation successfully created and ${deliveryStatus === "delivered" ? "sent to" : "queued for"} ${email.trim()}`,
      invitationId,
      deliveryStatus,
      deliveryError: emailResult.error || null,
      inviteUrl: emailResult.inviteUrl, // Provided once to inviter for optional manual copy
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to issue workspace invitation" },
      { status: 500 }
    );
  }
}
