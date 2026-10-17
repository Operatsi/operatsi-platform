import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  requireWorkspacePermission,
  DEFAULT_WORKSPACE_ID,
} from "@/lib/serverWorkspaceAuth";
import {
  WorkspaceMember,
  WorkspaceStats,
  WORKSPACE_ROLES,
} from "@/lib/workspaceMembers";
import { isDatabaseConfigured } from "@/lib/supabase/db";
import {
  getPostgresWorkspaceMembers,
  getPostgresWorkspaceStats,
} from "@/lib/supabase/workspaceService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || DEFAULT_WORKSPACE_ID;

    // Verify actor has members.read permission
    const authResult = await requireWorkspacePermission(req, "members.read", workspaceId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const actor = authResult;

    // 1. Check PostgreSQL first if configured
    let members: WorkspaceMember[] = [];
    let stats: WorkspaceStats | null = null;

    if (isDatabaseConfigured()) {
      try {
        const pgMembers = await getPostgresWorkspaceMembers(workspaceId);
        const pgStats = await getPostgresWorkspaceStats(workspaceId);
        if (pgMembers && pgMembers.length > 0) {
          members = pgMembers;
          stats = pgStats;
        }
      } catch (pgErr) {
        console.warn("[API Workspace Members] PostgreSQL query failed, falling back to Firestore:", pgErr);
      }
    }

    // 2. Fallback to Firestore if PostgreSQL did not return records or is not configured
    if (members.length === 0) {
      const membersSnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("members")
        .get();

      let activeCount = 0;
      let adminCount = 0;

      membersSnap.forEach((doc) => {
        const data = doc.data() as WorkspaceMember;
        members.push({
          ...data,
          id: doc.id,
        });

        if (data.status === "active") activeCount++;
        if (data.role === "admin" || data.role === "owner") adminCount++;
      });

      const invitationsSnap = await adminDb
        .collection("workspaces")
        .doc(workspaceId)
        .collection("invitations")
        .where("status", "==", "pending")
        .get();

      const pendingCount = invitationsSnap.size;

      stats = {
        totalMembers: members.length,
        activeMembers: activeCount,
        pendingInvitations: pendingCount,
        workspaceAdmins: adminCount,
      };
    }

    return NextResponse.json({
      success: true,
      workspaceId,
      actorRole: actor.role,
      actorUid: actor.uid,
      stats,
      members,
      availableRoles: WORKSPACE_ROLES,
    });
  } catch (err: any) {
    if (err?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw err;
    }
    console.error("[API Workspace Members] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve workspace members" },
      { status: 500 }
    );
  }
}
