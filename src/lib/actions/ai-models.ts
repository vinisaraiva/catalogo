"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { aiModelInputSchema, aiModelPoseInputSchema } from "@/validations/ai";
import {
  buildAiModelPoseImagePath,
  extractAiModelPoseStoragePath,
} from "@/domain/ai-model-pose-image";
import { isAllowedImageMimeType, isAllowedImageSize } from "@/domain/product-image";
import type { Database } from "@/types/database";
import { actionError, actionOk, type ActionResult } from "./result";

const BUCKET = "ai-model-poses";
const BASE_PATH = "/admin/ia/modelos";

type AiModelPoseRow = Database["public"]["Tables"]["ai_model_poses"]["Row"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * TASKS.md Phase 6 "AI models": CRUD models, CRUD poses, upload reference
 * pose images, activate/deactivate both. Mirrors the `teams.ts`/
 * `collections.ts` create/update/setActive pattern used everywhere else in
 * this codebase — no delete action, same as teams/collections/competitions
 * (soft-delete via `active` only).
 */
export async function createAiModel(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = aiModelInputSchema.safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_models")
    .insert({ ...parsed.data, store_id: store.id })
    .select("id")
    .single();

  if (error) return actionError(`Não foi possível criar o modelo: ${error.message}`);

  revalidatePath(BASE_PATH);
  return actionOk({ id: data.id });
}

export async function updateAiModel(id: string, input: unknown): Promise<ActionResult> {
  const parsed = aiModelInputSchema.partial().safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_models")
    .update(parsed.data)
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar o modelo: ${error.message}`);

  revalidatePath(BASE_PATH);
  return actionOk(undefined);
}

export async function setAiModelActive(id: string, active: boolean): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_models")
    .update({ active })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar o modelo: ${error.message}`);

  revalidatePath(BASE_PATH);
  return actionOk(undefined);
}

async function isOwnedAiModel(
  supabase: SupabaseServerClient,
  aiModelId: string,
  storeId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("ai_models")
    .select("id")
    .eq("id", aiModelId)
    .eq("store_id", storeId)
    .maybeSingle();
  return Boolean(data);
}

export async function createAiModelPose(
  aiModelId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = aiModelPoseInputSchema.safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  if (!(await isOwnedAiModel(supabase, aiModelId, store.id))) {
    return actionError("Modelo de IA não encontrado.");
  }

  const { data, error } = await supabase
    .from("ai_model_poses")
    .insert({ ...parsed.data, ai_model_id: aiModelId, store_id: store.id })
    .select("id")
    .single();

  if (error) return actionError(`Não foi possível criar a pose: ${error.message}`);

  revalidatePath(`${BASE_PATH}/${aiModelId}`);
  return actionOk({ id: data.id });
}

export async function updateAiModelPose(id: string, input: unknown): Promise<ActionResult> {
  const parsed = aiModelPoseInputSchema.partial().safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: pose, error: fetchError } = await supabase
    .from("ai_model_poses")
    .select("ai_model_id")
    .eq("id", id)
    .eq("store_id", store.id)
    .maybeSingle();
  if (fetchError) return actionError(`Não foi possível carregar a pose: ${fetchError.message}`);
  if (!pose) return actionError("Pose não encontrada.");

  const { error } = await supabase
    .from("ai_model_poses")
    .update(parsed.data)
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar a pose: ${error.message}`);

  revalidatePath(`${BASE_PATH}/${pose.ai_model_id}`);
  return actionOk(undefined);
}

export async function setAiModelPoseActive(id: string, active: boolean): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: pose, error: fetchError } = await supabase
    .from("ai_model_poses")
    .select("ai_model_id")
    .eq("id", id)
    .eq("store_id", store.id)
    .maybeSingle();
  if (fetchError) return actionError(`Não foi possível carregar a pose: ${fetchError.message}`);
  if (!pose) return actionError("Pose não encontrada.");

  const { error } = await supabase
    .from("ai_model_poses")
    .update({ active })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar a pose: ${error.message}`);

  revalidatePath(`${BASE_PATH}/${pose.ai_model_id}`);
  return actionOk(undefined);
}

/**
 * Replaces a pose's reference photo. Follows the same validate-then-upload
 * pattern as `uploadProductImages`; unlike that one this only ever holds a
 * single file per pose, so a re-upload removes the previous object from
 * Storage after the new one is safely in place and the row is updated
 * (never leaves the row pointing at nothing if the delete of the old file
 * fails — the old file just becomes orphaned, harmless).
 */
export async function uploadAiModelPoseImage(
  poseId: string,
  formData: FormData,
): Promise<ActionResult<AiModelPoseRow>> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: pose, error: fetchError } = await supabase
    .from("ai_model_poses")
    .select("*")
    .eq("id", poseId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (fetchError) return actionError(`Não foi possível carregar a pose: ${fetchError.message}`);
  if (!pose) return actionError("Pose não encontrada.");

  const file = formData.get("file");
  if (!(file instanceof File)) return actionError("Selecione uma foto.");
  if (!isAllowedImageMimeType(file.type)) {
    return actionError(`Formato não suportado: ${file.name || file.type}. Use JPG, PNG ou WEBP.`);
  }
  if (!isAllowedImageSize(file.size)) {
    return actionError(`"${file.name}" é muito grande. O limite é 10MB por foto.`);
  }

  const path = buildAiModelPoseImagePath({
    storeId: store.id,
    aiModelId: pose.ai_model_id,
    mimeType: file.type,
    fileId: randomUUID(),
  });

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return actionError(`Não foi possível enviar a foto: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: updated, error: updateError } = await supabase
    .from("ai_model_poses")
    .update({ reference_image_url: publicUrl })
    .eq("id", poseId)
    .eq("store_id", store.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    await supabase.storage.from(BUCKET).remove([path]);
    return actionError(
      `Não foi possível salvar a foto: ${updateError?.message ?? "erro desconhecido"}`,
    );
  }

  const previousPath = pose.reference_image_url
    ? extractAiModelPoseStoragePath(pose.reference_image_url, BUCKET)
    : null;
  if (previousPath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  revalidatePath(`${BASE_PATH}/${pose.ai_model_id}`);
  return actionOk(updated);
}
