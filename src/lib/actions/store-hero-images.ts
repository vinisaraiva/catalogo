"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import {
  MAX_FILES_PER_UPLOAD,
  isAllowedImageMimeType,
  isAllowedImageSize,
} from "@/domain/product-image";
import { buildStoreHeroImagePath, extractStoreHeroImageStoragePath } from "@/domain/store-hero-image";
import type { Database } from "@/types/database";
import { actionError, actionOk, type ActionResult } from "./result";

const BUCKET = "store-assets";
const SETTINGS_PATH = "/admin/configuracoes";

type StoreHeroImageRow = Database["public"]["Tables"]["store_hero_images"]["Row"];

/**
 * DECISIONS.md ADR-035 — same validate-all-then-upload-all-or-nothing
 * shape as `uploadProductImages`, minus the product-ownership check (this
 * is store-level, not attached to a product) and `image_type` (hero
 * photos have no equivalent — they're all just "a hero photo").
 */
export async function uploadStoreHeroImages(formData: FormData): Promise<ActionResult<StoreHeroImageRow[]>> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) return actionError("Selecione ao menos uma foto.");
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return actionError(`Envie no máximo ${MAX_FILES_PER_UPLOAD} fotos por vez.`);
  }

  for (const file of files) {
    if (!isAllowedImageMimeType(file.type)) {
      return actionError(`Formato não suportado: ${file.name || file.type}. Use JPG, PNG ou WEBP.`);
    }
    if (!isAllowedImageSize(file.size)) {
      return actionError(`"${file.name}" é muito grande. O limite é 10MB por foto.`);
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("store_hero_images")
    .select("sort_order")
    .eq("store_id", store.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (existingError) {
    return actionError(`Não foi possível preparar o envio: ${existingError.message}`);
  }
  let nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const uploaded: { path: string; url: string; sortOrder: number }[] = [];

  for (const file of files) {
    const path = buildStoreHeroImagePath({ storeId: store.id, mimeType: file.type, fileId: randomUUID() });

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      if (uploaded.length > 0) {
        await supabase.storage.from(BUCKET).remove(uploaded.map((item) => item.path));
      }
      return actionError(`Não foi possível enviar "${file.name}": ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    uploaded.push({ path, url: publicUrl, sortOrder: nextSortOrder });
    nextSortOrder += 1;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("store_hero_images")
    .insert(
      uploaded.map((item) => ({
        store_id: store.id,
        url: item.url,
        sort_order: item.sortOrder,
      })),
    )
    .select("*");

  if (insertError) {
    await supabase.storage.from(BUCKET).remove(uploaded.map((item) => item.path));
    return actionError(`Não foi possível salvar as fotos: ${insertError.message}`);
  }

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/");
  return actionOk(inserted);
}

export async function deleteStoreHeroImage(imageId: string): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: image, error: fetchError } = await supabase
    .from("store_hero_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("store_id", store.id)
    .maybeSingle();

  if (fetchError) return actionError(`Não foi possível carregar a imagem: ${fetchError.message}`);
  if (!image) return actionError("Imagem não encontrada.");

  const path = extractStoreHeroImageStoragePath(image.url, BUCKET);
  if (path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeError) {
      return actionError(`Não foi possível remover o arquivo: ${removeError.message}`);
    }
  }

  const { error: deleteError } = await supabase
    .from("store_hero_images")
    .delete()
    .eq("id", imageId)
    .eq("store_id", store.id);

  if (deleteError) return actionError(`Não foi possível remover a imagem: ${deleteError.message}`);

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/");
  return actionOk(undefined);
}
