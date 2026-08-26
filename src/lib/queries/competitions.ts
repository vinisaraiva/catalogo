import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CompetitionRow = Database["public"]["Tables"]["competitions"]["Row"];

export async function listCompetitions(storeId: string): Promise<CompetitionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to list competitions: ${error.message}`);
  return data ?? [];
}

export async function getCompetition(storeId: string, id: string): Promise<CompetitionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load competition: ${error.message}`);
  return data;
}

/**
 * Mirrors `getTeamBySlug` (queries/teams.ts) — used by the storefront's
 * "Categorias" browsing (Home tiles → `/busca?competition=slug`; see
 * DECISIONS.md ADR-032), where the URL carries a slug, not an id.
 */
export async function getCompetitionBySlug(
  storeId: string,
  slug: string,
): Promise<CompetitionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load competition: ${error.message}`);
  return data;
}
