"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { teamInputSchema } from "@/validations/team";
import { actionError, actionOk, type ActionResult } from "./result";

export async function createTeam(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = teamInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .insert({ ...parsed.data, store_id: store.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return actionError("Já existe um time com esse slug.");
    return actionError(`Não foi possível criar o time: ${error.message}`);
  }

  revalidatePath("/admin/times");
  return actionOk({ id: data.id });
}

export async function updateTeam(id: string, input: unknown): Promise<ActionResult> {
  const parsed = teamInputSchema.partial().safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .update(parsed.data)
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) {
    if (error.code === "23505") return actionError("Já existe um time com esse slug.");
    return actionError(`Não foi possível atualizar o time: ${error.message}`);
  }

  revalidatePath("/admin/times");
  return actionOk(undefined);
}

export async function setTeamActive(id: string, active: boolean): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .update({ active })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar o time: ${error.message}`);

  revalidatePath("/admin/times");
  return actionOk(undefined);
}
