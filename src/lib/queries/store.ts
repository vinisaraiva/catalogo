import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

/**
 * Public-safe: relies on the `stores_public_read_active` RLS policy, so an
 * anonymous caller only ever gets a row back when the store is `active`.
 */
export async function getActiveStoreBySlug(slug: string): Promise<StoreRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load store: ${error.message}`);
  return data;
}
