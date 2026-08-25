import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

export async function listCollections(storeId: string): Promise<CollectionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to list collections: ${error.message}`);
  return data ?? [];
}

export async function getCollection(storeId: string, id: string): Promise<CollectionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load collection: ${error.message}`);
  return data;
}
