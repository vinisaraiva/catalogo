import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database, TeamType } from "@/types/database";

export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export interface TeamFilter {
  featuredOnly?: boolean;
  type?: TeamType;
}

/**
 * Used by both admin (no filter — members must see every team, active or
 * not, to manage them) and the public storefront (e.g. `featuredOnly` for
 * Home's "times populares", `type: "national_team"` for the "seleções"
 * section). RLS narrows results to `active` teams of an `active` store for
 * an anonymous caller regardless of these filters — see
 * `teams_public_read_active` in the RLS migration.
 */
export async function listTeams(storeId: string, filter: TeamFilter = {}): Promise<TeamRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("teams")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (filter.featuredOnly) query = query.eq("featured", true);
  if (filter.type) query = query.eq("type", filter.type);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list teams: ${error.message}`);
  return data ?? [];
}

export async function getTeam(storeId: string, id: string): Promise<TeamRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load team: ${error.message}`);
  return data;
}

export async function getTeamBySlug(storeId: string, slug: string): Promise<TeamRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load team: ${error.message}`);
  return data;
}
