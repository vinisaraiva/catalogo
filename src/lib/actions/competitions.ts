"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { competitionInputSchema } from "@/validations/competition";
import { actionError, actionOk, type ActionResult } from "./result";

export async function createCompetition(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = competitionInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("competitions")
    .insert({ ...parsed.data, store_id: store.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return actionError("Já existe uma competição com esse slug.");
    return actionError(`Não foi possível criar a competição: ${error.message}`);
  }

  revalidatePath("/admin/competicoes");
  return actionOk({ id: data.id });
}

export async function updateCompetition(id: string, input: unknown): Promise<ActionResult> {
  const parsed = competitionInputSchema.partial().safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("competitions")
    .update(parsed.data)
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) {
    if (error.code === "23505") return actionError("Já existe uma competição com esse slug.");
    return actionError(`Não foi possível atualizar a competição: ${error.message}`);
  }

  revalidatePath("/admin/competicoes");
  return actionOk(undefined);
}

export async function setCompetitionActive(id: string, active: boolean): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("competitions")
    .update({ active })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar a competição: ${error.message}`);

  revalidatePath("/admin/competicoes");
  return actionOk(undefined);
}
