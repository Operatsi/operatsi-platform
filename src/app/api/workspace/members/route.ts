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

    // 1. Fetch all members in this workspace
    const membersSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("members")
      .get();

    const members: WorkspaceMember[] = [];
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

    // 2. Fetch pending invitations count
    const invitationsSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("invitations")
      .where("status", "==", "pending")
      .get();

    const pendingCount = invitationsSnap.size;

    const stats: WorkspaceStats = {
      totalMembers: members.length,
      activeMembers: activeCount,
      pendingInvitations: pendingCount,
      workspaceAdmins: adminCount,
    };

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
    console.error("[API Workspace Members] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve workspace members" },
      { status: 500 }
    );
  }
}
