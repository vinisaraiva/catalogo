import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AiModelRow = Database["public"]["Tables"]["ai_models"]["Row"];
export type AiModelPoseRow = Database["public"]["Tables"]["ai_model_poses"]["Row"];

export async function listAiModels(storeId: string): Promise<AiModelRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to list AI models: ${error.message}`);
  return data ?? [];
}

export async function getAiModel(storeId: string, id: string): Promise<AiModelRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load AI model: ${error.message}`);
  return data;
}

/** All active models + all active poses for a store, in one round trip —
 * the shape `selectModelAutomatically`/`selectPoseAutomatically`
 * (src/domain/ai-selection.ts) and the manual-mode picker UI both need. */
export async function listActiveAiModelsWithPoses(
  storeId: string,
): Promise<{ models: AiModelRow[]; poses: AiModelPoseRow[] }> {
  const supabase = await createClient();
  const [{ data: models, error: modelsError }, { data: poses, error: posesError }] =
    await Promise.all([
      supabase
        .from("ai_models")
        .select("*")
        .eq("store_id", storeId)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("ai_model_poses").select("*").eq("store_id", storeId).eq("active", true),
    ]);

  if (modelsError) throw new Error(`Failed to list active AI models: ${modelsError.message}`);
  if (posesError) throw new Error(`Failed to list active AI model poses: ${posesError.message}`);

  return { models: models ?? [], poses: poses ?? [] };
}

export async function listAiModelPoses(
  storeId: string,
  aiModelId: string,
): Promise<AiModelPoseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_model_poses")
    .select("*")
    .eq("store_id", storeId)
    .eq("ai_model_id", aiModelId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to list AI model poses: ${error.message}`);
  return data ?? [];
}

export async function getAiModelPose(storeId: string, id: string): Promise<AiModelPoseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_model_poses")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load AI model pose: ${error.message}`);
  return data;
}
