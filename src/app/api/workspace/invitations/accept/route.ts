import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { authenticateRequest, recordWorkspaceAudit } from "@/lib/serverWorkspaceAuth";
import { hashToken } from "@/lib/invitationEmail";
import {
  WorkspaceInvitation,
  normalizeEmail,
  WorkspaceMember,
} from "@/lib/workspaceMembers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Invalid invitation token provided" }, { status: 400 });
    }

    // 1. Authenticate user from Firebase ID token
    const user = await authenticateRequest(req);
    if (!user || !user.uid || !user.email) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to accept this invitation." },
        { status: 401 }
      );
    }

    const tokenHash = hashToken(token);

    // 2. Perform atomic acceptance inside a Firestore transaction
    const result = await adminDb.runTransaction(async (transaction) => {
      // Lookup token in global token index
      const tokenRef = adminDb.collection("workspace_invitations_by_token").doc(tokenHash);
      const tokenDoc = await transaction.get(tokenRef);

      if (!tokenDoc.exists) {
        throw new Error("This invitation link is invalid or has already been accepted.");
      }

      const tokenData = tokenDoc.data();
      const { workspaceId, invitationId, expiresAt, status } = tokenData || {};

      if (status !== "pending") {
        throw new Error(`This invitation is no longer active (status: ${status}).`);
      }

      // Check expiration
      const expiresMillis = expiresAt?.seconds ? expiresAt.seconds * 1000 : new Date(expiresAt).getTime();
      if (expiresMillis < Date.now()) {
        throw new Error("This invitation link has expired. Please request a new invitation.");
      }

      // Read invitation document
      const invitationRef = adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("invitations")
        .doc(invitationId);

      const inviteDoc = await transaction.get(invitationRef);
      if (!inviteDoc.exists) {
        throw new Error("Invitation record not found.");
      }

      const inviteData = inviteDoc.data() as WorkspaceInvitation;
      if (inviteData.status !== "pending") {
        throw new Error(`This invitation has already been ${inviteData.status}.`);
      }

      // 3. Verify Identity: Check authenticated user's email matches the invited email
      const authenticatedEmailNormalized = normalizeEmail(user.email);
      const invitedEmailNormalized = inviteData.invitedEmailNormalized || normalizeEmail(inviteData.invitedEmail);

      if (authenticatedEmailNormalized !== invitedEmailNormalized) {
        throw new Error(
          `Email mismatch: You are signed in as ${user.email}, but this invitation was sent to ${inviteData.invitedEmail}. Please switch to the invited account.`
        );
      }

      // 4. Create or reconcile workspace member document
      const memberRef = adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("members")
        .doc(user.uid);

      const memberDoc = await transaction.get(memberRef);
      const memberName = user.name || user.email.split("@")[0] || "Team Member";

      if (memberDoc.exists) {
        // Already a member — update role if needed
        transaction.update(memberRef, {
          status: "active",
          role: inviteData.role,
          updatedAt: FieldValue.serverTimestamp(),
          lastActiveAt: FieldValue.serverTimestamp(),
        });
      } else {
        const newMember: Partial<WorkspaceMember> = {
          id: user.uid,
          workspaceId,
          userId: user.uid,
          email: user.email,
          emailNormalized: authenticatedEmailNormalized,
          name: memberName,
          displayName: memberName,
          role: inviteData.role,
          status: "active",
          joinedAt: FieldValue.serverTimestamp(),
          lastActiveAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        transaction.set(memberRef, newMember);
      }

      // 5. Mark invitation accepted
      transaction.update(invitationRef, {
        status: "accepted",
        acceptedBy: user.uid,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 6. Delete from active tokens to guarantee single-use consumption
      transaction.delete(tokenRef);

      return {
        workspaceId,
        invitationId,
        role: inviteData.role,
        inviterName: inviteData.inviterName,
        invitedEmail: inviteData.invitedEmail,
        invitedBy: inviteData.invitedBy,
      };
    });

    // 7. Record audit log
    await recordWorkspaceAudit(result.workspaceId, {
      actorUserId: user.uid,
      actorName: user.name || user.email.split("@")[0],
      actorEmail: user.email,
      targetUserId: user.uid,
      targetEmail: user.email,
      action: "invitation_accepted",
      newValue: `Accepted role: ${result.role}`,
    });

    // 8. Notify the inviter that their invite was accepted
    try {
      if (result.invitedBy) {
        const notifRef = adminDb
          .collection("users")
          .doc(result.invitedBy)
          .collection("notifications")
          .doc();

        await notifRef.set({
          schemaVersion: 1,
          type: "invitation_accepted",
          category: "tasks",
          title: "Invitation Accepted",
          body: `${user.name || user.email} accepted your invitation to join as ${result.role}.`,
          workspaceId: result.workspaceId,
          actorId: user.uid,
          actorName: user.name || user.email,
          resourceType: "workspace",
          resourceId: result.workspaceId,
          actionUrl: "/settings",
          priority: "normal",
          deduplicationKey: `${result.invitedBy}_invite_accepted_${Date.now()}`,
          createdAt: FieldValue.serverTimestamp(),
          readAt: null,
          archivedAt: null,
        });
      }
    } catch (notifErr) {
      console.warn("[API Accept Invitation] Notification to inviter skipped:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to the workspace! You have joined as ${result.role}.`,
      workspaceId: result.workspaceId,
      role: result.role,
    });
  } catch (err: any) {
    console.error("[API Workspace Invitations Accept] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to accept workspace invitation" },
      { status: 400 }
    );
  }
}
