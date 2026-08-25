import { z } from "zod";

/**
 * An env var that's genuinely unset (`undefined`) and one that's present in
 * `.env.local`/`.env.example` but left blank (`""`, e.g. `GOOGLE_CLOUD_PROJECT=`
 * as a documented-but-empty placeholder) must both count as "not
 * configured" — `.env.example`'s AI section is deliberately checked in
 * with every key blank so a developer sees what to fill in, and that file
 * gets copied to `.env.local` verbatim. A plain `.optional()` only treats
 * `undefined` that way; an empty string still fails `.min(1)`. This
 * normalizes `""` to `undefined` before the rest of the schema runs.
 */
const optionalTrimmedString = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional(),
  );

/**
 * Server-side environment schema.
 *
 * Validated once at import time so misconfiguration fails fast instead of
 * surfacing as an obscure runtime error deep in a request handler.
 *
 * IMPORTANT: never import this module from a Client Component — it may
 * read server-only secrets (e.g. SUPABASE_SERVICE_ROLE_KEY).
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: optionalTrimmedString(),
  DEFAULT_STORE_SLUG: z.string().optional(),
  DEFAULT_DAILY_AI_GENERATION_LIMIT: z.coerce.number().int().positive().optional(),
  // AI (CLAUDE.md "AI architecture": "AI must be optional") — all optional
  // so an install with no AI configured still boots and serves the normal
  // catalog. `getTryOnProvider()` (src/lib/ai/get-try-on-provider.ts) is
  // what actually requires these, and only at the moment a generation is
  // triggered — never at module load / app boot.
  TRYON_AI_PROVIDER: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(["google_vto"]).optional(),
  ),
  GOOGLE_CLOUD_PROJECT: optionalTrimmedString(),
  GOOGLE_CLOUD_LOCATION: optionalTrimmedString(),
  GOOGLE_APPLICATION_CREDENTIALS: optionalTrimmedString(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

/**
 * Lazily validate and cache server environment variables.
 * Throws with a readable message listing every missing/invalid variable.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Client-safe environment schema — only NEXT_PUBLIC_* variables.
 * Safe to import from Client Components.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid public environment configuration:\n${issues}`);
  }
  return parsed.data;
}
