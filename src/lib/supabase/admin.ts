import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/env";

/**
 * Privileged Supabase client using the service-role key. Bypasses RLS.
 *
 * SERVER-ONLY. Never import this module from a Client Component or any
 * code path that could end up in the browser bundle.
 *
 * Per CLAUDE.md ("Security" / "server-only client where justified"), only
 * use this for operations that cannot be expressed under RLS as the calling
 * user — e.g. seeding, or trusted server-side jobs that must act across
 * stores. Prefer lib/supabase/server.ts (RLS-scoped) for everything else.
 */
export function createAdminClient() {
  const env = getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The admin client must not be used without it.",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
