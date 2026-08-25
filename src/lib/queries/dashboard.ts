import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface DashboardCounts {
  activeProducts: number;
  draftProducts: number;
  soldOutProducts: number;
  aiUsedToday: number;
  aiDailyLimit: number;
}

/**
 * Dashboard counts (PRD §14). The AI numbers are real queries against
 * `ai_generations` / `store_settings`, not a hardcoded placeholder — they
 * just read as "0 of N" until Phase 6 (AI Foundation) actually writes
 * `ai_generations` rows. TASKS.md Phase 2 calls this line a "placeholder"
 * because the AI feature itself doesn't exist yet, not because the number
 * shown is fake.
 */
export async function getDashboardCounts(storeId: string): Promise<DashboardCounts> {
  const supabase = await createClient();

  const [activeRes, draftRes, soldOutRes, settingsRes, aiTodayRes] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "active"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "draft"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "sold_out"),
    supabase.from("store_settings").select("daily_ai_generation_limit").eq("store_id", storeId).maybeSingle(),
    supabase
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", startOfTodayIso()),
  ]);

  return {
    activeProducts: activeRes.count ?? 0,
    draftProducts: draftRes.count ?? 0,
    soldOutProducts: soldOutRes.count ?? 0,
    aiUsedToday: aiTodayRes.count ?? 0,
    aiDailyLimit: settingsRes.data?.daily_ai_generation_limit ?? 0,
  };
}

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}
