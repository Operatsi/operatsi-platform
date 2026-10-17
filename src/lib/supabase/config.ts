// ===============================================================
// OPERATSI — SUPABASE CONFIGURATION & ENVIRONMENT VALIDATION
// Enterprise PostgreSQL & Supabase Integration Config
// ===============================================================

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasDatabaseUrl: boolean;
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  url: string;
  missingVariables: string[];
}

const PLACEHOLDER_PREFIXES = ["REPLACE_WITH_", "your_", "CHANGE_ME"];

function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  return PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function getSupabaseConfig(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xvmlsgaxrrtkgxgkbzhb.supabase.co";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  const missing: string[] = [];

  const hasPublishableKey = Boolean(publishableKey && !isPlaceholder(publishableKey));
  const hasSecretKey = Boolean(secretKey && !isPlaceholder(secretKey));
  const hasDatabaseUrl = Boolean(databaseUrl && !isPlaceholder(databaseUrl));

  if (!hasPublishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!hasSecretKey) missing.push("SUPABASE_SECRET_KEY");
  if (!hasDatabaseUrl) missing.push("DATABASE_URL");

  // Server-side check: Ensure sensitive keys are NEVER prefixed with NEXT_PUBLIC_
  if (typeof window !== "undefined") {
    if ((window as any).SUPABASE_SECRET_KEY || (window as any).DATABASE_URL) {
      console.error("[CRITICAL SECURITY] Privileged credentials detected in browser scope!");
    }
  }

  return {
    isConfigured: hasPublishableKey && hasSecretKey,
    hasDatabaseUrl,
    hasSecretKey,
    hasPublishableKey,
    url,
    missingVariables: missing,
  };
}
