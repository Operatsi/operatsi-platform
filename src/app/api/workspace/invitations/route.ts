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
  removeUndefinedFields,
} from "@/lib/workspaceMembers";
import {
  generateSecureToken,
  sendWorkspaceInvitationEmail,
} from "@/lib/invitationEmail";
import { isDatabaseConfigured } from "@/lib/supabase/db";
import {
  getPostgresWorkspaceInvitations,
  createPostgresWorkspaceInvitation,
  recordPostgresSecurityAudit,
  ensurePostgresWorkspace,
} from "@/lib/supabase/workspaceService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || DEFAULT_WORKSPACE_ID;

    const authResult = await requireWorkspacePermission(req, "members.read", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const invitations: Omit<WorkspaceInvitation, "tokenHash">[] = [];

    // 1. Check PostgreSQL first if configured
    if (isDatabaseConfigured()) {
      try {
        const pgInvites = await getPostgresWorkspaceInvitations(workspaceId);
        if (pgInvites && pgInvites.length > 0) {
          for (const inv of pgInvites) {
            const { tokenHash, ...safeInvite } = inv;
            invitations.push(safeInvite);
          }
        }
      } catch (pgErr) {
        console.warn("[API Workspace Invitations GET] PostgreSQL query failed, falling back to Firestore:", pgErr);
      }
    }

    // 2. Fallback to Firestore if PostgreSQL did not return records or is not configured
    if (invitations.length === 0) {
      const invitationsSnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("invitations")
        .orderBy("createdAt", "desc")
        .get();

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
    }

    return NextResponse.json({
      success: true,
      workspaceId,
      invitations,
    });
  } catch (err: any) {
    if (err?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw err;
    }
    console.error("[API Workspace Invitations GET] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve workspace invitations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      email,
      role = "member",
      message,
      workspaceId = DEFAULT_WORKSPACE_ID,
    } = body;

    // 1. Strict validation of required workspaceId
    if (!workspaceId || typeof workspaceId !== "string" || !workspaceId.trim()) {
      return NextResponse.json({ error: "Invalid or missing workspace identifier." }, { status: 400 });
    }

    // 2. Strict validation of required recipient email
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid work email address" }, { status: 400 });
    }

    // 3. Strict validation of invitable role
    const validRoles: WorkspaceRole[] = ["admin", "manager", "member", "viewer"];
    if (!role || !validRoles.includes(role as WorkspaceRole)) {
      return NextResponse.json(
        { error: `Invalid role '${role}'. Permitted roles are: admin, manager, member, viewer.` },
        { status: 400 }
      );
    }

    // 4. Safe message normalization: trim if string, otherwise empty string
    const normalizedMessage =
      typeof message === "string"
        ? message.trim()
        : "";

    const emailNormalized = normalizeEmail(email);

    // 5. Authorization check: does actor have members.invite permission?
    const authResult = await requireWorkspacePermission(req, "members.invite", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // 6. Verify actor is authorized to assign this role
    if (!canAssignRole(actor.role, role as WorkspaceRole)) {
      return NextResponse.json(
        { error: `Forbidden: role '${actor.role}' cannot assign role '${role}'` },
        { status: 403 }
      );
    }

    const idempotencyKey =
      req.headers.get("x-idempotency-key") ||
      req.headers.get("idempotency-key") ||
      body.idempotencyKey ||
      null;

    // If an idempotency key is supplied, check if we already processed this request
    if (idempotencyKey) {
      const existingKeySnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("invitations")
        .where("idempotencyKey", "==", idempotencyKey)
        .limit(1)
        .get();

      if (!existingKeySnap.empty) {
        const existingData = existingKeySnap.docs[0].data() as WorkspaceInvitation;
        return NextResponse.json({
          success: true,
          idempotent: true,
          message: `Existing invitation retrieved for ${existingData.invitedEmail}`,
          invitationId: existingKeySnap.docs[0].id,
          deliveryStatus: existingData.deliveryStatus,
          deliveryError: existingData.deliveryError || null,
        });
      }
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

    // Resolve application base URL
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    // 9. Dispatch real email via Resend (with verified SMTP fallback)
    const inviterName = actor.displayName || actor.email?.split("@")[0] || "Workspace Admin";
    const emailResult = await sendWorkspaceInvitationEmail({
      toEmail: email.trim(),
      inviterName,
      workspaceName,
      role,
      rawToken,
      expiresAt: expirationDate,
      customMessage: normalizedMessage.length > 0 ? normalizedMessage : undefined,
      appBaseUrl,
    });

    const deliveryStatus = emailResult.success ? "delivered" : "failed";

    // 10. Persist invitation record (normalize optional fields and omit undefined)
    const invitationData: Record<string, any> = {
      id: invitationId,
      workspaceId,
      invitedEmail: email.trim(),
      invitedEmailNormalized: emailNormalized,
      role: role as WorkspaceRole,
      invitedBy: actor.uid,
      inviterName,
      tokenHash,
      status: "pending",
      expiresAt,
      deliveryStatus,
      deliveryError: emailResult.error || null,
      deliveryMessageId: emailResult.messageId || null,
      idempotencyKey: idempotencyKey || null,
      emailProvider: emailResult.provider || null,
      acceptedBy: null,
      acceptedAt: null,
      revokedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // If a personal message is provided, store the trimmed string; otherwise omit field to satisfy Firestore
    if (normalizedMessage.length > 0) {
      invitationData.message = normalizedMessage;
    }

    await invitationRef.set(removeUndefinedFields(invitationData));

    // 11. Store reverse token hash lookup for fast single-use token verification
    await adminDb
      .collection("workspace_invitations_by_token")
      .doc(tokenHash)
      .set(
        removeUndefinedFields({
          workspaceId,
          invitationId,
          tokenHash,
          invitedEmailNormalized: emailNormalized,
          expiresAt,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        })
      );

    // 12. Record audit log in Firestore
    await recordWorkspaceAudit(workspaceId, {
      actorUserId: actor.uid,
      actorName: inviterName,
      actorEmail: actor.email,
      targetEmail: email.trim(),
      action: "invitation_created",
      newValue: `Role: ${role}, Delivery: ${deliveryStatus}`,
    });

    // 13. Synchronize to PostgreSQL if configured
    try {
      await ensurePostgresWorkspace(workspaceId, {
        uid: actor.uid,
        email: actor.email,
        name: inviterName,
      });

      await createPostgresWorkspaceInvitation({
        workspaceId,
        invitedEmail: email.trim(),
        role: role as WorkspaceRole,
        invitedBy: actor.uid,
        inviterName,
        tokenHash,
        message: normalizedMessage.length > 0 ? normalizedMessage : undefined,
        expiresAt: expirationDate,
        deliveryStatus,
        deliveryError: emailResult.error || null,
        deliveryMessageId: emailResult.messageId || null,
      });

      await recordPostgresSecurityAudit({
        workspaceId,
        actorUserId: actor.uid,
        actorName: actor.displayName,
        actorEmail: actor.email,
        targetEmail: email.trim(),
        action: "invitation_created",
        newValue: `Role: ${role}, Delivery: ${deliveryStatus}`,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      });
    } catch (pgErr) {
      console.warn("[API Workspace Invitations POST] PostgreSQL sync error:", pgErr);
    }

    return NextResponse.json({
      success: true,
      message: deliveryStatus === "delivered"
        ? `Invitation email sent to ${email.trim()} via ${emailResult.provider.toUpperCase()}`
        : `Invitation created in workspace, but email provider dispatch failed: ${emailResult.error || "Unknown error"}`,
      invitationId,
      deliveryStatus,
      deliveryProvider: emailResult.provider,
      deliveryMessageId: emailResult.messageId || null,
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
