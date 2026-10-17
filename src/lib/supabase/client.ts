import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xvmlsgaxrrtkgxgkbzhb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the public browser-safe Supabase client.
 * Does not expose privileged database access.
 */
export function getSupabaseClient(firebaseIdToken?: string): SupabaseClient | null {
  if (!supabaseAnonKey || supabaseAnonKey.startsWith("REPLACE_WITH_")) {
    // Missing publishable key, gracefully return null
    return null;
  }

  // If a Firebase ID token is provided, inject it as the Authorization Bearer header
  // for Supabase's third-party Firebase Auth verification
  if (firebaseIdToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
        },
      },
    });
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}
