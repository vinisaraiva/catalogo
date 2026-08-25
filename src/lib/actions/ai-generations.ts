"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { triggerTryOnGenerationInputSchema } from "@/validations/ai";
import {
  deriveLastUsedModelId,
  selectModelAutomatically,
  selectPoseAutomatically,
} from "@/domain/ai-selection";
import { isQuotaAvailable } from "@/domain/ai-quota";
import { buildProductImagePath, extractStoragePathFromPublicUrl } from "@/domain/product-image";
import { getDailyAiUsage } from "@/lib/queries/ai-usage";
import { getTryOnProvider } from "@/lib/ai/get-try-on-provider";
import { TryOnProviderError, type TryOnProvider } from "@/domain/try-on-provider";
import type { Database } from "@/types/database";
import { actionError, actionOk, type ActionResult } from "./result";

const PRODUCT_IMAGES_BUCKET = "product-images";

type AiGenerationRow = Database["public"]["Tables"]["ai_generations"]["Row"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** PRD.md §11: shown when quota is exhausted. Verbatim copy — the UI
 * displays `error` as-is, so this string IS the product copy. */
const QUOTA_EXHAUSTED_MESSAGE =
  "Limite diário de IA atingido. Você ainda pode cadastrar e publicar produtos usando suas fotos normalmente.";

async function fetchProductOriginalImageUrl(
  supabase: SupabaseServerClient,
  storeId: string,
  productId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("product_images")
    .select("url")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .in("image_type", ["original", "detail"])
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.url ?? null;
}

/**
 * TASKS.md Phase 6 "AI generations" + "Selection logic" + "Daily quota".
 * Implements the full flow from ARCHITECTURE.md §14:
 *   authenticate -> authorize store -> read daily limit -> count eligible
 *   generations -> quota available? no -> reject without provider call;
 *   yes -> provider call -> persist result/status.
 *
 * Returns `ok:true` even when the *generation itself* fails (provider
 * error) — that's a normal, trackable outcome (CLAUDE.md "AI failures
 * should be recorded distinctly from successful generations"), not a
 * request-level problem. `ok:false` is reserved for validation errors,
 * quota exhaustion, and "nothing to generate from/with" states.
 */
export async function triggerTryOnGeneration(
  input: unknown,
): Promise<ActionResult<AiGenerationRow>> {
  const parsed = triggerTryOnGenerationInputSchema.safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  const { productId, mode, aiModelId, aiModelPoseId } = parsed.data;

  const { store, user } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (productError)
    return actionError(`Não foi possível carregar o produto: ${productError.message}`);
  if (!product) return actionError("Produto não encontrado.");

  const originalImageUrl = await fetchProductOriginalImageUrl(supabase, store.id, productId);
  if (!originalImageUrl) {
    return actionError("Adicione ao menos uma foto do produto antes de gerar arte com IA.");
  }

  const usage = await getDailyAiUsage(store.id);
  if (!isQuotaAvailable(usage.limit, usage.usedToday)) {
    return actionError(QUOTA_EXHAUSTED_MESSAGE);
  }

  let resolvedModelId: string;
  let resolvedPoseId: string;

  if (mode === "manual") {
    const { data: pose, error: poseError } = await supabase
      .from("ai_model_poses")
      .select("id, ai_model_id, active, reference_image_url")
      .eq("id", aiModelPoseId as string)
      .eq("store_id", store.id)
      .maybeSingle();
    if (poseError) return actionError(`Não foi possível carregar a pose: ${poseError.message}`);
    if (!pose || !pose.active || pose.ai_model_id !== aiModelId) {
      return actionError("Modelo/pose selecionado é inválido.");
    }
    if (!pose.reference_image_url) {
      return actionError("Essa pose ainda não tem foto de referência cadastrada.");
    }
    resolvedModelId = pose.ai_model_id;
    resolvedPoseId = pose.id;
  } else {
    const { data: models, error: modelsError } = await supabase
      .from("ai_models")
      .select("id, active")
      .eq("store_id", store.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (modelsError)
      return actionError(`Não foi possível carregar modelos: ${modelsError.message}`);

    const { data: poses, error: posesError } = await supabase
      .from("ai_model_poses")
      .select("id, ai_model_id, active, usage_count, last_used_at, reference_image_url")
      .eq("store_id", store.id)
      .eq("active", true);
    if (posesError) return actionError(`Não foi possível carregar poses: ${posesError.message}`);

    const posesWithPhoto = (poses ?? []).filter((pose) => pose.reference_image_url);
    const selectableModels = (models ?? []).map((m) => ({ id: m.id, active: m.active }));
    const selectablePoses = posesWithPhoto.map((p) => ({
      id: p.id,
      aiModelId: p.ai_model_id,
      active: p.active,
      usageCount: p.usage_count,
      lastUsedAt: p.last_used_at,
    }));

    const lastUsedModelId = deriveLastUsedModelId(selectablePoses);
    const chosenModelId = selectModelAutomatically(selectableModels, lastUsedModelId);
    if (!chosenModelId) {
      return actionError("Nenhum modelo de IA ativo cadastrado.");
    }
    const chosenPoseId = selectPoseAutomatically(selectablePoses, chosenModelId);
    if (!chosenPoseId) {
      return actionError("Nenhuma pose ativa com foto de referência para o modelo selecionado.");
    }
    resolvedModelId = chosenModelId;
    resolvedPoseId = chosenPoseId;
  }

  const { data: pose, error: poseFetchError } = await supabase
    .from("ai_model_poses")
    .select("reference_image_url, usage_count")
    .eq("id", resolvedPoseId)
    .single();
  if (poseFetchError || !pose?.reference_image_url) {
    return actionError("Não foi possível carregar a foto de referência da pose selecionada.");
  }

  let provider: TryOnProvider;
  try {
    provider = getTryOnProvider();
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Provedor de IA não configurado.";
    return actionError(message);
  }

  const { data: generation, error: insertError } = await supabase
    .from("ai_generations")
    .insert({
      store_id: store.id,
      user_id: user.id,
      product_id: productId,
      provider: provider.name,
      model: provider.model,
      generation_type: "try_on",
      status: "pending",
    })
    .select("*")
    .single();
  if (insertError || !generation) {
    return actionError(`Não foi possível registrar a geração: ${insertError?.message}`);
  }

  await supabase.from("ai_generations").update({ status: "processing" }).eq("id", generation.id);

  try {
    const result = await provider.generate({
      personImageUrl: pose.reference_image_url,
      productImageUrl: originalImageUrl,
    });
    const image = result.images[0];
    if (!image) throw new TryOnProviderError("Provedor de IA não retornou nenhuma imagem.");

    const path = buildProductImagePath({
      storeId: store.id,
      productId,
      imageType: "generated",
      mimeType: image.mimeType,
      fileId: randomUUID(),
    });
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, Buffer.from(image.base64, "base64"), {
        contentType: image.mimeType,
        upsert: false,
      });
    if (uploadError) {
      throw new TryOnProviderError(`Falha ao salvar imagem gerada: ${uploadError.message}`);
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

    const { data: succeeded, error: succeedError } = await supabase
      .from("ai_generations")
      .update({
        status: "succeeded",
        result_image_url: publicUrl,
        cost_estimate: result.costEstimate ?? null,
      })
      .eq("id", generation.id)
      .select("*")
      .single();
    if (succeedError || !succeeded) {
      return actionError(
        `Geração concluída, mas falha ao salvar o registro: ${succeedError?.message}`,
      );
    }

    // Track usage only on success — see src/domain/ai-selection.ts header
    // comment: rotation stats should reflect finished images, not attempts.
    // Read-then-write (not a SQL increment) — acceptable at this app's
    // scale (a handful of store admins, not concurrent bulk generation);
    // a lost update here would only make automatic selection's rotation
    // slightly less even, never incorrect or unsafe. Documented assumption
    // (see DECISIONS.md), same tradeoff already accepted elsewhere in this
    // codebase (plans/README.md "Other findings... not turned into plans").
    await supabase
      .from("ai_model_poses")
      .update({ usage_count: pose.usage_count + 1, last_used_at: new Date().toISOString() })
      .eq("id", resolvedPoseId);

    revalidatePath(`/admin/produtos/${productId}`);
    return actionOk(succeeded);
  } catch (cause) {
    const message =
      cause instanceof TryOnProviderError
        ? cause.message
        : cause instanceof Error
          ? cause.message
          : "Falha desconhecida ao gerar imagem.";

    const { data: failed } = await supabase
      .from("ai_generations")
      .update({ status: "failed", error_message: message })
      .eq("id", generation.id)
      .select("*")
      .single();

    revalidatePath(`/admin/produtos/${productId}`);
    return actionOk(failed ?? { ...generation, status: "failed", error_message: message });
  }
}

/**
 * ARCHITECTURE.md §12 "Admin review -> approve": creates the real
 * `product_images` row from the candidate and marks the generation
 * `approved`. Never auto-publish (CLAUDE.md) — this is the one and only
 * path a generated image becomes visible in the catalog, and it always
 * requires an explicit admin action.
 */
export async function approveAiGeneration(generationId: string): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: generation, error: fetchError } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("id", generationId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (fetchError) return actionError(`Não foi possível carregar a geração: ${fetchError.message}`);
  if (!generation) return actionError("Geração não encontrada.");
  if (generation.status !== "succeeded" || !generation.result_image_url || !generation.product_id) {
    return actionError("Essa geração não está disponível para aprovação.");
  }

  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", generation.product_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: image, error: imageError } = await supabase
    .from("product_images")
    .insert({
      store_id: store.id,
      product_id: generation.product_id,
      image_type: "generated",
      url: generation.result_image_url,
      sort_order: nextSortOrder,
      ai_generated: true,
    })
    .select("id")
    .single();
  if (imageError || !image) {
    return actionError(`Não foi possível publicar a imagem: ${imageError?.message}`);
  }

  const { error: updateError } = await supabase
    .from("ai_generations")
    .update({ status: "approved", product_image_id: image.id })
    .eq("id", generationId)
    .eq("store_id", store.id);
  if (updateError) return actionError(`Não foi possível aprovar a geração: ${updateError.message}`);

  revalidatePath(`/admin/produtos/${generation.product_id}`);
  return actionOk(undefined);
}

/** ARCHITECTURE.md §12 "Admin review -> discard". Best-effort Storage
 * cleanup — a failed removal doesn't block marking the generation
 * discarded, since the point is getting the bad candidate out of the
 * admin's review queue. */
export async function discardAiGeneration(generationId: string): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: generation, error: fetchError } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("id", generationId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (fetchError) return actionError(`Não foi possível carregar a geração: ${fetchError.message}`);
  if (!generation) return actionError("Geração não encontrada.");
  if (generation.status !== "succeeded") {
    return actionError("Essa geração não está disponível para descarte.");
  }

  if (generation.result_image_url) {
    const path = extractStoragePathFromPublicUrl(
      generation.result_image_url,
      PRODUCT_IMAGES_BUCKET,
    );
    if (path) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    }
  }

  const { error: updateError } = await supabase
    .from("ai_generations")
    .update({ status: "discarded" })
    .eq("id", generationId)
    .eq("store_id", store.id);
  if (updateError)
    return actionError(`Não foi possível descartar a geração: ${updateError.message}`);

  if (generation.product_id) revalidatePath(`/admin/produtos/${generation.product_id}`);
  return actionOk(undefined);
}
