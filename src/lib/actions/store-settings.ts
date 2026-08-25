"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { dailyAiGenerationLimitInputSchema } from "@/validations/ai";
import { actionError, actionOk, type ActionResult } from "./result";

/**
 * TASKS.md Phase 6 "Daily quota": "Add store daily limit setting". Every
 * store already has a `store_settings` row from `scripts/seed.ts`, but
 * `upsert` is used (not `update`) so this action is correct even for a
 * store whose row is somehow missing.
 */
export async function updateDailyAiGenerationLimit(input: unknown): Promise<ActionResult> {
  const parsed = dailyAiGenerationLimitInputSchema.safeParse(input);
  if (!parsed.success) return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("store_settings")
    .upsert(
      { store_id: store.id, daily_ai_generation_limit: parsed.data.daily_ai_generation_limit },
      { onConflict: "store_id" },
    );

  if (error) return actionError(`Não foi possível salvar o limite: ${error.message}`);

  revalidatePath("/admin/configuracoes");
  return actionOk(undefined);
}
