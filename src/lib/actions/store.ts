"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { storeProfileInputSchema } from "@/validations/store";
import { buildStoreLogoPath, extractStoreAssetStoragePath } from "@/domain/store-asset";
import { isAllowedImageMimeType, isAllowedImageSize } from "@/domain/product-image";
import type { Database } from "@/types/database";
import { actionError, actionOk, type ActionResult } from "./result";

const BUCKET = "store-assets";
const SETTINGS_PATH = "/admin/configuracoes";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

/**
 * PRD.md §7 "Store": name, WhatsApp number, Instagram — the fields an
 * admin actually needs to fill in before the storefront is usable (the
 * WhatsApp CTAs on `/`, `/produto/[slug]` and `SelectionBar` all render
 * conditionally on `whatsapp_number`). Relies entirely on the existing
 * `stores_member_update_own` RLS policy — no new policy needed.
 */
export async function updateStoreProfile(input: unknown): Promise<ActionResult> {
  const parsed = storeProfileInputSchema.safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("stores")
    .update({
      name: parsed.data.name,
      whatsapp_number: parsed.data.whatsapp_number || null,
      instagram_url: parsed.data.instagram_url || null,
    })
    .eq("id", store.id);

  if (error) return actionError(`Não foi possível salvar os dados da loja: ${error.message}`);

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/");
  return actionOk(undefined);
}

/**
 * Replaces the catalog logo. Same validate-then-upload-then-swap pattern
 * as `uploadAiModelPoseImage`: the new file only replaces the DB pointer
 * (`stores.logo_url`) after it's safely uploaded, and the previous file is
 * removed afterward, best-effort.
 */
export async function uploadStoreLogo(formData: FormData): Promise<ActionResult<StoreRow>> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File)) return actionError("Selecione uma imagem.");
  if (!isAllowedImageMimeType(file.type)) {
    return actionError(`Formato não suportado: ${file.name || file.type}. Use JPG, PNG ou WEBP.`);
  }
  if (!isAllowedImageSize(file.size)) {
    return actionError(`"${file.name}" é muito grande. O limite é 10MB.`);
  }

  const path = buildStoreLogoPath({ storeId: store.id, mimeType: file.type, fileId: randomUUID() });

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return actionError(`Não foi possível enviar a logo: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: updated, error: updateError } = await supabase
    .from("stores")
    .update({ logo_url: publicUrl })
    .eq("id", store.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    await supabase.storage.from(BUCKET).remove([path]);
    return actionError(
      `Não foi possível salvar a logo: ${updateError?.message ?? "erro desconhecido"}`,
    );
  }

  const previousPath = store.logo_url ? extractStoreAssetStoragePath(store.logo_url, BUCKET) : null;
  if (previousPath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/");
  return actionOk(updated);
}
