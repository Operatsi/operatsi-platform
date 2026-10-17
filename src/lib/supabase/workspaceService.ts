import "server-only";
import { sqlQuery, withTransaction, isDatabaseConfigured, sanitizeLog } from "./db";
import {
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceStats,
  WorkspaceRole,
  normalizeEmail,
} from "@/lib/workspaceMembers";

export interface DBUserProfile {
  id: string;
  email: string;
  email_normalized: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface SecurityAuditParams {
  workspaceId: string;
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  action: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Ensures user profile exists in PostgreSQL.
 */
export async function ensurePostgresUserProfile(user: {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const emailNormalized = normalizeEmail(user.email);
  const name = user.name || user.displayName || user.email.split("@")[0] || "User";
  const displayName = user.displayName || name;

  const query = `
    INSERT INTO public.user_profiles (id, email, email_normalized, name, display_name, avatar_url, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, timezone('utc'::text, now()))
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      email_normalized = EXCLUDED.email_normalized,
      name = EXCLUDED.name,
      display_name = COALESCE(EXCLUDED.display_name, public.user_profiles.display_name),
      updated_at = timezone('utc'::text, now());
  `;

  try {
    await sqlQuery(query, [
      user.uid,
      user.email,
      emailNormalized,
      name,
      displayName,
      user.avatarUrl || null,
    ]);
    return true;
  } catch (err: any) {
    console.error("[PostgreSQL ensureUserProfile Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Ensures workspace exists in PostgreSQL.
 */
export async function ensurePostgresWorkspace(
  workspaceId: string,
  owner: { uid: string; email: string; name?: string }
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  await ensurePostgresUserProfile(owner);

  const query = `
    INSERT INTO public.workspaces (id, name, slug, owner_id, updated_at)
    VALUES ($1, $2, $3, $4, timezone('utc'::text, now()))
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    const slug = workspaceId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    await sqlQuery(query, [workspaceId, "OperatSI Enterprise Core", slug, owner.uid]);
    return true;
  } catch (err: any) {
    console.error("[PostgreSQL ensureWorkspace Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Retrieves all members of a workspace from PostgreSQL.
 */
export async function getPostgresWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[] | null> {
  if (!isDatabaseConfigured()) return null;

  const query = `
    SELECT 
      m.id AS member_id,
      m.workspace_id,
      m.user_id,
      m.role_id,
      m.status,
      m.joined_at,
      m.last_active_at,
      m.created_at,
      m.updated_at,
      p.email,
      p.email_normalized,
      p.name,
      p.display_name,
      p.avatar_url,
      p.job_title,
      p.language,
      p.time_zone
    FROM public.workspace_members m
    JOIN public.user_profiles p ON m.user_id = p.id
    WHERE m.workspace_id = $1
    ORDER BY m.joined_at ASC;
  `;

  try {
    const res = await sqlQuery(query, [workspaceId]);
    if (!res) return null;

    return res.rows.map((row) => ({
      id: row.user_id,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      email: row.email,
      emailNormalized: row.email_normalized,
      name: row.name,
      displayName: row.display_name || row.name,
      avatarUrl: row.avatar_url || undefined,
      role: row.role_id as WorkspaceRole,
      status: row.status,
      joinedAt: row.joined_at ? new Date(row.joined_at) : new Date(),
      lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));
  } catch (err: any) {
    console.error("[PostgreSQL getWorkspaceMembers Error]", sanitizeLog(err.message));
    return null;
  }
}

/**
 * Retrieves workspace statistics from PostgreSQL.
 */
export async function getPostgresWorkspaceStats(
  workspaceId: string
): Promise<WorkspaceStats | null> {
  if (!isDatabaseConfigured()) return null;

  const membersQuery = `
    SELECT 
      COUNT(*)::int AS total_members,
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int AS active_members,
      COUNT(CASE WHEN role_id IN ('admin', 'owner') THEN 1 END)::int AS workspace_admins
    FROM public.workspace_members
    WHERE workspace_id = $1;
  `;

  const invitesQuery = `
    SELECT COUNT(*)::int AS pending_invitations
    FROM public.workspace_invitations
    WHERE workspace_id = $1 AND status = 'pending' AND expires_at > timezone('utc'::text, now());
  `;

  try {
    const [membersRes, invitesRes] = await Promise.all([
      sqlQuery(membersQuery, [workspaceId]),
      sqlQuery(invitesQuery, [workspaceId]),
    ]);

    if (!membersRes || !invitesRes) return null;

    const m = membersRes.rows[0] || {};
    const i = invitesRes.rows[0] || {};

    return {
      totalMembers: m.total_members || 0,
      activeMembers: m.active_members || 0,
      pendingInvitations: i.pending_invitations || 0,
      workspaceAdmins: m.workspace_admins || 0,
    };
  } catch (err: any) {
    console.error("[PostgreSQL getWorkspaceStats Error]", sanitizeLog(err.message));
    return null;
  }
}

/**
 * Updates a member's role in PostgreSQL with transaction integrity.
 */
export async function updatePostgresMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const query = `
    UPDATE public.workspace_members
    SET role_id = $1, updated_at = timezone('utc'::text, now())
    WHERE workspace_id = $2 AND user_id = $3;
  `;

  try {
    const res = await sqlQuery(query, [newRole, workspaceId, targetUserId]);
    return !!(res && (res.rowCount ?? 0) > 0);
  } catch (err: any) {
    console.error("[PostgreSQL updateMemberRole Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Removes a member from PostgreSQL.
 */
export async function removePostgresMember(
  workspaceId: string,
  targetUserId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const query = `
    DELETE FROM public.workspace_members
    WHERE workspace_id = $1 AND user_id = $2;
  `;

  try {
    const res = await sqlQuery(query, [workspaceId, targetUserId]);
    return !!(res && (res.rowCount ?? 0) > 0);
  } catch (err: any) {
    console.error("[PostgreSQL removeMember Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Retrieves all invitations for a workspace from PostgreSQL.
 */
export async function getPostgresWorkspaceInvitations(
  workspaceId: string
): Promise<WorkspaceInvitation[] | null> {
  if (!isDatabaseConfigured()) return null;

  // Auto-expire past-due invitations first
  const expireQuery = `
    UPDATE public.workspace_invitations
    SET status = 'expired', updated_at = timezone('utc'::text, now())
    WHERE workspace_id = $1 AND status = 'pending' AND expires_at <= timezone('utc'::text, now());
  `;

  const selectQuery = `
    SELECT 
      id,
      workspace_id,
      invited_email,
      invited_email_normalized,
      role_id,
      invited_by,
      inviter_name,
      token_hash,
      status,
      message,
      delivery_status,
      delivery_error,
      delivery_message_id,
      expires_at,
      accepted_by,
      accepted_at,
      revoked_at,
      created_at,
      updated_at
    FROM public.workspace_invitations
    WHERE workspace_id = $1
    ORDER BY created_at DESC;
  `;

  try {
    await sqlQuery(expireQuery, [workspaceId]);
    const res = await sqlQuery(selectQuery, [workspaceId]);
    if (!res) return null;

    return res.rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      invitedEmail: row.invited_email,
      invitedEmailNormalized: row.invited_email_normalized,
      role: row.role_id as WorkspaceRole,
      invitedBy: row.invited_by,
      inviterName: row.inviter_name,
      tokenHash: row.token_hash,
      status: row.status,
      message: row.message || "",
      deliveryStatus: row.delivery_status,
      deliveryError: row.delivery_error,
      deliveryMessageId: row.delivery_message_id,
      expiresAt: row.expires_at ? new Date(row.expires_at) : new Date(),
      acceptedBy: row.accepted_by,
      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    }));
  } catch (err: any) {
    console.error("[PostgreSQL getWorkspaceInvitations Error]", sanitizeLog(err.message));
    return null;
  }
}

/**
 * Creates an invitation in PostgreSQL.
 */
export async function createPostgresWorkspaceInvitation(params: {
  workspaceId: string;
  invitedEmail: string;
  role: WorkspaceRole;
  invitedBy: string;
  inviterName: string;
  tokenHash: string;
  message?: string;
  expiresAt: Date;
  deliveryStatus: "delivered" | "failed" | "pending";
  deliveryError?: string | null;
  deliveryMessageId?: string | null;
}): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;

  const emailNormalized = normalizeEmail(params.invitedEmail);

  // Invalidate any previous pending invitations for this email in this workspace
  const cancelQuery = `
    UPDATE public.workspace_invitations
    SET status = 'revoked', revoked_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
    WHERE workspace_id = $1 AND invited_email_normalized = $2 AND status = 'pending';
  `;

  const insertQuery = `
    INSERT INTO public.workspace_invitations (
      workspace_id,
      invited_email,
      invited_email_normalized,
      role_id,
      invited_by,
      inviter_name,
      token_hash,
      status,
      message,
      delivery_status,
      delivery_error,
      delivery_message_id,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12)
    RETURNING id;
  `;

  try {
    return await withTransaction(async (client) => {
      await client.query(cancelQuery, [params.workspaceId, emailNormalized]);
      const res = await client.query(insertQuery, [
        params.workspaceId,
        params.invitedEmail,
        emailNormalized,
        params.role,
        params.invitedBy,
        params.inviterName,
        params.tokenHash,
        params.message || null,
        params.deliveryStatus,
        params.deliveryError || null,
        params.deliveryMessageId || null,
        params.expiresAt,
      ]);
      return res.rows[0]?.id || null;
    });
  } catch (err: any) {
    console.error("[PostgreSQL createWorkspaceInvitation Error]", sanitizeLog(err.message));
    return null;
  }
}

/**
 * Accepts an invitation in PostgreSQL with full ACID transaction guarantees.
 */
export async function acceptPostgresWorkspaceInvitation(
  tokenHash: string,
  user: { uid: string; email: string; name?: string }
): Promise<{ success: boolean; workspaceId?: string; role?: WorkspaceRole; error?: string }> {
  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not configured" };
  }

  const userEmailNormalized = normalizeEmail(user.email);

  try {
    const result = await withTransaction(async (client) => {
      // 1. Lock and fetch invitation row
      const inviteRes = await client.query(
        `SELECT * FROM public.workspace_invitations WHERE token_hash = $1 FOR UPDATE;`,
        [tokenHash]
      );

      if (inviteRes.rows.length === 0) {
        throw new Error("This invitation link is invalid or has already been accepted.");
      }

      const invite = inviteRes.rows[0];

      if (invite.status !== "pending") {
        throw new Error(`This invitation is no longer active (status: ${invite.status}).`);
      }

      const expiresAt = new Date(invite.expires_at).getTime();
      if (expiresAt < Date.now()) {
        throw new Error("This invitation link has expired. Please request a new invitation.");
      }

      if (invite.invited_email_normalized !== userEmailNormalized) {
        throw new Error(
          `Email mismatch: You are signed in as ${user.email}, but this invitation was sent to ${invite.invited_email}.`
        );
      }

      // 2. Ensure user profile exists
      const userName = user.name || user.email.split("@")[0] || "User";
      await client.query(
        `INSERT INTO public.user_profiles (id, email, email_normalized, name, display_name, updated_at)
         VALUES ($1, $2, $3, $4, $4, timezone('utc'::text, now()))
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           email_normalized = EXCLUDED.email_normalized,
           updated_at = timezone('utc'::text, now());`,
        [user.uid, user.email, userEmailNormalized, userName]
      );

      // 3. Mark invitation accepted
      await client.query(
        `UPDATE public.workspace_invitations
         SET status = 'accepted', accepted_by = $1, accepted_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
         WHERE id = $2;`,
        [user.uid, invite.id]
      );

      // 4. Upsert workspace member
      await client.query(
        `INSERT INTO public.workspace_members (workspace_id, user_id, role_id, status, joined_at, updated_at)
         VALUES ($1, $2, $3, 'active', timezone('utc'::text, now()), timezone('utc'::text, now()))
         ON CONFLICT (workspace_id, user_id) DO UPDATE SET
           role_id = EXCLUDED.role_id,
           status = 'active',
           updated_at = timezone('utc'::text, now());`,
        [invite.workspace_id, user.uid, invite.role_id]
      );

      return {
        success: true,
        workspaceId: invite.workspace_id,
        role: invite.role_id as WorkspaceRole,
      };
    });

    return result || { success: false, error: "Transaction failed" };
  } catch (err: any) {
    console.error("[PostgreSQL acceptWorkspaceInvitation Error]", sanitizeLog(err.message));
    return { success: false, error: err.message };
  }
}

/**
 * Revokes an invitation in PostgreSQL.
 */
export async function revokePostgresWorkspaceInvitation(
  workspaceId: string,
  invitationId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const query = `
    UPDATE public.workspace_invitations
    SET status = 'revoked', revoked_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())
    WHERE id = $1 AND workspace_id = $2 AND status = 'pending';
  `;

  try {
    const res = await sqlQuery(query, [invitationId, workspaceId]);
    return !!(res && (res.rowCount ?? 0) > 0);
  } catch (err: any) {
    console.error("[PostgreSQL revokeWorkspaceInvitation Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Updates an invitation's role in PostgreSQL.
 */
export async function updatePostgresInvitationRole(
  workspaceId: string,
  invitationId: string,
  newRole: WorkspaceRole
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const query = `
    UPDATE public.workspace_invitations
    SET role_id = $1, updated_at = timezone('utc'::text, now())
    WHERE id = $2 AND workspace_id = $3 AND status = 'pending';
  `;

  try {
    const res = await sqlQuery(query, [newRole, invitationId, workspaceId]);
    return !!(res && (res.rowCount ?? 0) > 0);
  } catch (err: any) {
    console.error("[PostgreSQL updateInvitationRole Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Updates an invitation with fresh token entropy and expiration upon resend.
 */
export async function resendPostgresWorkspaceInvitation(params: {
  workspaceId: string;
  invitationId: string;
  tokenHash: string;
  expiresAt: Date;
  deliveryStatus: "delivered" | "failed";
  deliveryError?: string | null;
  deliveryMessageId?: string | null;
}): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const query = `
    UPDATE public.workspace_invitations
    SET token_hash = $1,
        status = 'pending',
        expires_at = $2,
        delivery_status = $3,
        delivery_error = $4,
        delivery_message_id = $5,
        updated_at = timezone('utc'::text, now())
    WHERE id = $6 AND workspace_id = $7;
  `;

  try {
    const res = await sqlQuery(query, [
      params.tokenHash,
      params.expiresAt,
      params.deliveryStatus,
      params.deliveryError || null,
      params.deliveryMessageId || null,
      params.invitationId,
      params.workspaceId,
    ]);
    return !!(res && (res.rowCount ?? 0) > 0);
  } catch (err: any) {
    console.error("[PostgreSQL resendWorkspaceInvitation Error]", sanitizeLog(err.message));
    return false;
  }
}

/**
 * Records an entry into the security audit log in PostgreSQL.
 */
export async function recordPostgresSecurityAudit(params: SecurityAuditParams): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const query = `
    INSERT INTO public.security_audit_logs (
      workspace_id,
      actor_user_id,
      actor_name,
      actor_email,
      target_user_id,
      target_email,
      action,
      previous_value,
      new_value,
      ip_address,
      user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
  `;

  try {
    await sqlQuery(query, [
      params.workspaceId,
      params.actorUserId,
      params.actorName,
      params.actorEmail,
      params.targetUserId || null,
      params.targetEmail || null,
      params.action,
      params.previousValue || null,
      params.newValue || null,
      params.ipAddress || null,
      params.userAgent || null,
    ]);
    return true;
  } catch (err: any) {
    console.error("[PostgreSQL recordSecurityAudit Error]", sanitizeLog(err.message));
    return false;
  }
}
