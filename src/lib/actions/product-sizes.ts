"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { productSizeInputSchema } from "@/validations/product";
import { actionError, actionOk, type ActionResult } from "./result";

export async function addProductSize(productId: string, input: unknown): Promise<ActionResult> {
  const parsed = productSizeInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  // Confirm the product belongs to this store before attaching a size to
  // it — RLS also enforces this, but a clear error beats a silent no-op.
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (!product) return actionError("Produto não encontrado.");

  const { error } = await supabase.from("product_sizes").insert({
    ...parsed.data,
    product_id: productId,
    store_id: store.id,
  });

  if (error) {
    if (error.code === "23505") return actionError("Esse tamanho já foi adicionado.");
    return actionError(`Não foi possível adicionar o tamanho: ${error.message}`);
  }

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(undefined);
}

export async function removeProductSize(sizeId: string, productId: string): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_sizes")
    .delete()
    .eq("id", sizeId)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível remover o tamanho: ${error.message}`);

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(undefined);
}

export async function setProductSizeActive(
  sizeId: string,
  productId: string,
  active: boolean,
): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_sizes")
    .update({ active })
    .eq("id", sizeId)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar o tamanho: ${error.message}`);

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(undefined);
}

export async function updateProductSizeQuantity(
  sizeId: string,
  productId: string,
  quantity: number | null,
): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_sizes")
    .update({ quantity })
    .eq("id", sizeId)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar o estoque: ${error.message}`);

  revalidatePath(`/admin/produtos/${productId}`);
  return actionOk(undefined);
}
