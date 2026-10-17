import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  WorkspaceRole,
  WorkspacePermission,
  hasPermission,
  WorkspaceMember,
  normalizeEmail,
} from "@/lib/workspaceMembers";
import { isDatabaseConfigured, sqlQuery } from "@/lib/supabase/db";
import {
  ensurePostgresWorkspace,
  recordPostgresSecurityAudit,
} from "@/lib/supabase/workspaceService";

export interface AuthenticatedActor {
  uid: string;
  email: string;
  displayName: string;
  role: WorkspaceRole;
  workspaceId: string;
}

export const DEFAULT_WORKSPACE_ID = "ws_primary";
export const DEFAULT_WORKSPACE_NAME = "OperatSI Enterprise Core";

/**
 * Extracts and verifies the Firebase ID token from the request Authorization header.
 */
export async function authenticateRequest(req: NextRequest): Promise<{ uid: string; email: string; name?: string } | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || decoded.displayName || "",
    };
  } catch (err) {
    console.warn("[WorkspaceAuth] verifyIdToken failed:", err);
    return null;
  }
}

/**
 * Resolves workspace actor and verifies membership + role.
 * If the workspace has not been initialized with any members yet,
 * bootstraps the authenticated user as the first 'owner'.
 */
export async function getWorkspaceActor(
  req: NextRequest,
  requestedWorkspaceId?: string
): Promise<AuthenticatedActor | null> {
  const user = await authenticateRequest(req);
  if (!user || !user.uid) return null;

  const workspaceId = requestedWorkspaceId || req.headers.get("x-workspace-id") || DEFAULT_WORKSPACE_ID;

  // 1. Check PostgreSQL first if configured
  if (isDatabaseConfigured()) {
    try {
      const res = await sqlQuery(
        `SELECT m.role_id, m.status, p.email, p.name, p.display_name
         FROM public.workspace_members m
         JOIN public.user_profiles p ON m.user_id = p.id
         WHERE m.workspace_id = $1 AND m.user_id = $2
         LIMIT 1;`,
        [workspaceId, user.uid]
      );

      if (res && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          uid: user.uid,
          email: row.email || user.email,
          displayName: row.display_name || row.name || user.name || user.email.split("@")[0],
          role: (row.role_id as WorkspaceRole) || "member",
          workspaceId,
        };
      }
    } catch (pgErr) {
      console.warn("[WorkspaceAuth] PostgreSQL actor lookup notice:", pgErr);
    }
  }

  // 2. Check if user is an existing member of this workspace in Firestore
  const memberDoc = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(user.uid)
    .get();

  if (memberDoc.exists) {
    const data = memberDoc.data() as WorkspaceMember;
    return {
      uid: user.uid,
      email: data.email || user.email,
      displayName: data.name || data.displayName || user.name || user.email.split("@")[0],
      role: (data.role as WorkspaceRole) || "member",
      workspaceId,
    };
  }

  // 2. Check if the workspace exists or has any members
  const membersSnap = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .limit(1)
    .get();

  // If no members exist yet in this workspace, bootstrap caller as initial Owner
  if (membersSnap.empty) {
    const initialName = user.name || user.email.split("@")[0] || "Administrator";
    const initialMember: Partial<WorkspaceMember> = {
      id: user.uid,
      workspaceId,
      userId: user.uid,
      email: user.email,
      emailNormalized: normalizeEmail(user.email),
      name: initialName,
      displayName: initialName,
      role: "owner",
      status: "active",
      joinedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("members")
      .doc(user.uid)
      .set(initialMember);

    // Also update workspace document metadata
    await adminDb.collection("workspaces").doc(workspaceId).set(
      {
        name: DEFAULT_WORKSPACE_NAME,
        slug: "operatsi-core-prod-01",
        ownerId: user.uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Synchronize initial owner to PostgreSQL if configured
    if (isDatabaseConfigured()) {
      try {
        await ensurePostgresWorkspace(workspaceId, {
          uid: user.uid,
          email: user.email,
          name: initialName,
        });

        await sqlQuery(
          `INSERT INTO public.workspace_members (workspace_id, user_id, role_id, status)
           VALUES ($1, $2, 'owner', 'active')
           ON CONFLICT (workspace_id, user_id) DO NOTHING;`,
          [workspaceId, user.uid]
        );
      } catch (pgErr) {
        console.warn("[WorkspaceAuth] PostgreSQL initial owner bootstrap notice:", pgErr);
      }
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: initialName,
      role: "owner",
      workspaceId,
    };
  }

  return null;
}

/**
 * Enforces permission check for a workspace operation.
 */
export async function requireWorkspacePermission(
  req: NextRequest,
  permission: WorkspacePermission,
  workspaceId?: string
): Promise<AuthenticatedActor | { error: string; status: number }> {
  const actor = await getWorkspaceActor(req, workspaceId);

  if (!actor) {
    return { error: "Authentication required or user is not a member of this workspace", status: 401 };
  }

  if (!hasPermission(actor.role, permission)) {
    return {
      error: `Forbidden: role '${actor.role}' lacks required permission '${permission}'`,
      status: 403,
    };
  }

  return actor;
}

/**
 * Records an immutable audit event in the workspace audit log collection.
 */
export async function recordWorkspaceAudit(
  workspaceId: string,
  event: {
    actorUserId: string;
    actorName: string;
    actorEmail: string;
    targetUserId?: string | null;
    targetEmail: string;
    action:
      | "invitation_created"
      | "invitation_accepted"
      | "invitation_revoked"
      | "invitation_resent"
      | "invitation_role_changed"
      | "member_joined"
      | "member_removed"
      | "member_role_changed";
    previousValue?: string | null;
    newValue?: string | null;
  }
) {
  try {
    const auditRef = adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("audit")
      .doc();

    await auditRef.set({
      id: auditRef.id,
      workspaceId,
      ...event,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Also persist audit log to PostgreSQL if configured
    if (isDatabaseConfigured()) {
      try {
        await recordPostgresSecurityAudit({
          workspaceId,
          actorUserId: event.actorUserId,
          actorName: event.actorName,
          actorEmail: event.actorEmail,
          targetUserId: event.targetUserId,
          targetEmail: event.targetEmail,
          action: event.action,
          previousValue: event.previousValue,
          newValue: event.newValue,
        });
      } catch (pgErr) {
        console.warn("[WorkspaceAudit] PostgreSQL audit sync notice:", pgErr);
      }
    }
  } catch (err) {
    console.error("[WorkspaceAudit] Failed to write audit event:", err);
  }
}
