import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xvmlsgaxrrtkgxgkbzhb.supabase.co";
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "";

let adminClientInstance: SupabaseClient | null = null;

/**
 * Returns a privileged Supabase client for server-side trusted operations.
 * NEVER call or import this function on client components.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseSecretKey || supabaseSecretKey.startsWith("REPLACE_WITH_")) {
    return null;
  }

  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClientInstance;
}
