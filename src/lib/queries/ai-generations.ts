import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AiGenerationRow = Database["public"]["Tables"]["ai_generations"]["Row"];

/** Newest first — the product's AI panel (ARCHITECTURE.md §12 "Admin
 * review") shows the most recent candidate at the top. */
export async function listGenerationsForProduct(
  storeId: string,
  productId: string,
): Promise<AiGenerationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list AI generations: ${error.message}`);
  return data ?? [];
}

export async function getAiGeneration(
  storeId: string,
  id: string,
): Promise<AiGenerationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load AI generation: ${error.message}`);
  return data;
}
