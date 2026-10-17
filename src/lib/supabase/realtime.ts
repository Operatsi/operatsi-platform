import { getSupabaseClient } from "./client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeSubscriptionOptions {
  workspaceId: string;
  firebaseIdToken?: string;
  onMemberChange?: (payload: any) => void;
  onInvitationChange?: (payload: any) => void;
  onError?: (err: any) => void;
}

export interface RealtimeSubscriptionHandle {
  unsubscribe: () => void;
}

/**
 * Subscribes to real-time PostgreSQL changes via Supabase Realtime.
 * Authorized using the caller's Firebase ID token or publishable key.
 * 
 * If Supabase is not configured or in placeholder mode, returns a no-op subscription handle
 * allowing the application to gracefully fall back to Firestore listeners.
 */
export function subscribeToWorkspaceRealtime(
  options: RealtimeSubscriptionOptions
): RealtimeSubscriptionHandle {
  const { workspaceId, firebaseIdToken, onMemberChange, onInvitationChange, onError } = options;

  const supabase = getSupabaseClient(firebaseIdToken);
  if (!supabase) {
    // Supabase client not initialized or using placeholders — return no-op handle
    return {
      unsubscribe: () => {},
    };
  }

  let channel: RealtimeChannel | null = null;

  try {
    const channelName = `workspace-room-${workspaceId}`;
    channel = supabase.channel(channelName);

    // 1. Listen for changes to workspace_members filtered by workspace_id
    if (onMemberChange) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_members",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onMemberChange(payload);
        }
      );
    }

    // 2. Listen for changes to workspace_invitations filtered by workspace_id
    if (onInvitationChange) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_invitations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onInvitationChange(payload);
        }
      );
    }

    channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" && onError) {
        onError(err || new Error(`Channel subscription failed for workspace ${workspaceId}`));
      }
    });
  } catch (err) {
    console.warn("[Supabase Realtime] Could not initialize channel:", err);
    if (onError) onError(err);
  }

  return {
    unsubscribe: () => {
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    },
  };
}
