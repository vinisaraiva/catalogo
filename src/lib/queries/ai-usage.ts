import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { ELIGIBLE_AI_GENERATION_STATUSES } from "@/domain/ai-quota";

export interface AiUsageStatus {
  limit: number;
  usedToday: number;
}

/** Fallback used only if a store's `store_settings` row is somehow missing
 * (every store gets one via `scripts/seed.ts`, but this keeps quota checks
 * from hard-failing on a not-yet-seeded/misconfigured store — CLAUDE.md "If
 * quota is exhausted, the rest of the app must continue working
 * normally" extends to "if quota config is missing, don't 500"). */
const DEFAULT_DAILY_LIMIT = 10;

/** Today's window in UTC — simplest correct definition given the store's
 * own timezone isn't modeled anywhere in this schema (documented
 * assumption, see DECISIONS.md). */
function startOfTodayUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * ARCHITECTURE.md §14: "read store daily limit -> count eligible
 * successful/charged generations". Used both to gate a new generation
 * (`ai-generations.ts` actions) and to show usage in the admin UI
 * (TASKS.md Phase 6 "Show usage in admin" — PRD.md §11: "7 de 10 gerações
 * utilizadas hoje").
 */
export async function getDailyAiUsage(storeId: string): Promise<AiUsageStatus> {
  const supabase = await createClient();

  const [{ data: settings, error: settingsError }, { count, error: countError }] =
    await Promise.all([
      supabase
        .from("store_settings")
        .select("daily_ai_generation_limit")
        .eq("store_id", storeId)
        .maybeSingle(),
      supabase
        .from("ai_generations")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .in("status", ELIGIBLE_AI_GENERATION_STATUSES)
        .gte("created_at", startOfTodayUtc()),
    ]);

  if (settingsError) {
    throw new Error(`Failed to load store AI settings: ${settingsError.message}`);
  }
  if (countError) {
    throw new Error(`Failed to count today's AI generations: ${countError.message}`);
  }

  const limit = settings?.daily_ai_generation_limit ?? getFallbackLimit();
  return { limit, usedToday: count ?? 0 };
}

function getFallbackLimit(): number {
  try {
    return getServerEnv().DEFAULT_DAILY_AI_GENERATION_LIMIT ?? DEFAULT_DAILY_LIMIT;
  } catch {
    return DEFAULT_DAILY_LIMIT;
  }
}
