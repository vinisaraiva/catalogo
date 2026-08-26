import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StoreHeroImageRow = Database["public"]["Tables"]["store_hero_images"]["Row"];

/**
 * Public query — the storefront Home (DECISIONS.md ADR-035) reads this
 * with no auth, same as `listCompetitions`/`getStorefrontStore`. RLS
 * (`store_hero_images_public_read`) is what actually scopes this to an
 * active store; ordering by `sort_order` just keeps the admin's list and
 * this list consistent, even though Home itself picks one at random.
 */
export async function listStoreHeroImages(storeId: string): Promise<StoreHeroImageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_hero_images")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to list hero images: ${error.message}`);
  return data ?? [];
}
