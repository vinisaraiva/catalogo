"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { collectionInputSchema } from "@/validations/collection";
import { actionError, actionOk, type ActionResult } from "./result";

export async function createCollection(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = collectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("collections")
    .insert({ ...parsed.data, store_id: store.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return actionError("Já existe uma coleção com esse slug.");
    return actionError(`Não foi possível criar a coleção: ${error.message}`);
  }

  revalidatePath("/admin/colecoes");
  return actionOk({ id: data.id });
}

export async function updateCollection(id: string, input: unknown): Promise<ActionResult> {
  const parsed = collectionInputSchema.partial().safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("collections")
    .update(parsed.data)
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) {
    if (error.code === "23505") return actionError("Já existe uma coleção com esse slug.");
    return actionError(`Não foi possível atualizar a coleção: ${error.message}`);
  }

  revalidatePath("/admin/colecoes");
  return actionOk(undefined);
}

export async function setCollectionActive(id: string, active: boolean): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("collections")
    .update({ active })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar a coleção: ${error.message}`);

  revalidatePath("/admin/colecoes");
  return actionOk(undefined);
}
