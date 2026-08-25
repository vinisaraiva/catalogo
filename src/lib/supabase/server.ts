import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/env";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Reads/writes the auth session via Next.js cookies.
 *
 * Uses the anon key — requests are still subject to RLS as the calling
 * user. Do NOT use this for privileged operations; see admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll can be called from a Server Component, which cannot
            // set cookies. This is safe to ignore as long as middleware.ts
            // is refreshing the session (see middleware.ts).
          }
        },
      },
    },
  );
}
