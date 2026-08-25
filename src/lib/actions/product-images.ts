"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import {
  MAX_FILES_PER_UPLOAD,
  buildProductImagePath,
  extractStoragePathFromPublicUrl,
  isAllowedImageMimeType,
  isAllowedImageSize,
} from "@/domain/product-image";
import { productImageUploadTypeSchema } from "@/validations/product";
import { isValidReorder } from "@/domain/product-image-reorder";
import type { Database } from "@/types/database";
import { actionError, actionOk, type ActionResult } from "./result";

const BUCKET = "product-images";

type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function isOwnedProduct(
  supabase: SupabaseServerClient,
  productId: string,
  storeId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * PRD §15 Etapa 3 ("Tirar foto" / "Galeria") + TASKS.md Phase 5 "Upload".
 * Accepts one or more files under the `files` FormData key, validates each
 * ("Validate mime type" / "Validate file size"), then uploads them to
 * Storage under the store/product path. RLS on `storage.objects` (see the
 * Phase 5 migration) is the real enforcement; the store membership +
 * product-ownership checks here are the same belt-and-suspenders pattern
 * every other action in this codebase already follows.
 *
 * Every file is validated before any upload starts — a batch either
 * uploads entirely or not at all, so a request that fails partway never
 * leaves the product in a half-uploaded state.
 */
export async function uploadProductImages(
  productId: string,
  formData: FormData,
): Promise<ActionResult<ProductImageRow[]>> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  if (!(await isOwnedProduct(supabase, productId, store.id))) {
    return actionError("Produto não encontrado.");
  }

  const typeParsed = productImageUploadTypeSchema.safeParse(
    formData.get("image_type") ?? "original",
  );
  if (!typeParsed.success) return actionError("Tipo de imagem inválido.");
  const imageType = typeParsed.data;

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
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (existingError) {
    return actionError(`Não foi possível preparar o envio: ${existingError.message}`);
  }
  let nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const uploaded: { path: string; url: string; sortOrder: number }[] = [];

  for (const file of files) {
    const path = buildProductImagePath({
      storeId: store.id,
      productId,
      imageType,
      mimeType: file.type,
      fileId: randomUUID(),
    });

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      // Roll back whatever this batch already uploaded, so a mid-batch
      // failure never leaves orphaned files with no product_images row.
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
    .from("product_images")
    .insert(
      uploaded.map((item) => ({
        store_id: store.id,
        product_id: productId,
        image_type: imageType,
        url: item.url,
        sort_order: item.sortOrder,
      })),
    )
    .select("*");

  if (insertError) {
    // The files are already in Storage but have no DB row — clean them up
    // rather than leaving orphans an admin can never see or manage.
    await supabase.storage.from(BUCKET).remove(uploaded.map((item) => item.path));
    return actionError(`Não foi possível salvar as fotos: ${insertError.message}`);
  }

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(inserted);
}

/**
 * "Delete image safely" (TASKS.md Phase 5): removes the Storage object
 * first, the `product_images` row second. If the Storage delete fails, the
 * DB row is left untouched — still correctly pointing at a file that still
 * exists, safe to retry. If the DB delete then fails, the row is left
 * pointing at a now-deleted file — a visibly broken thumbnail the admin
 * can just delete again (`storage.remove` on an already-gone object is a
 * no-op, not an error). The opposite order risks a row silently pointing
 * at nothing with no visible sign anything is wrong.
 */
export async function deleteProductImage(
  imageId: string,
  productId: string,
): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: image, error: fetchError } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("store_id", store.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (fetchError) return actionError(`Não foi possível carregar a imagem: ${fetchError.message}`);
  if (!image) return actionError("Imagem não encontrada.");

  const path = extractStoragePathFromPublicUrl(image.url, BUCKET);
  if (path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeError) {
      return actionError(`Não foi possível remover o arquivo: ${removeError.message}`);
    }
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("store_id", store.id);

  if (deleteError) return actionError(`Não foi possível remover a imagem: ${deleteError.message}`);

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(undefined);
}

/**
 * "Reorder images" + "Select primary image" (TASKS.md Phase 5) share one
 * action: the caller sends the full new order for the product's images —
 * moving one to the front for "set as primary", or swapping two adjacent
 * ids for "move up/down" (both computed client-side in
 * ProductImagesManager) — and this rewrites `sort_order` to match. 0 is
 * always the primary/cover image.
 *
 * `orderedIds` must be exactly the product's current image ids, just
 * reordered — checked before writing anything, so a stale client (e.g. a
 * second browser tab) can't silently drop an image from the list.
 */
export async function reorderProductImages(
  productId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("store_id", store.id);

  if (currentError) {
    return actionError(`Não foi possível carregar as imagens: ${currentError.message}`);
  }

  const currentIds = (current ?? []).map((row) => row.id);
  if (!isValidReorder(currentIds, orderedIds)) {
    return actionError("Lista de imagens desatualizada — recarregue a página.");
  }

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("store_id", store.id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return actionError(`Não foi possível reordenar: ${failed.error.message}`);

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(undefined);
}
