"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { productInputSchema } from "@/validations/product";
import { buildDuplicateProductInput } from "@/domain/product";
import type { ProductStatus } from "@/types/database";
import { actionError, actionOk, type ActionResult } from "./result";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Verifies that team_id (required) and, if present, collection_id /
 * competition_id all belong to `storeId`. Necessary because Postgres
 * foreign-key checks run with elevated privileges and bypass RLS on the
 * referenced table — `products_member_all` RLS only protects the
 * `products` row itself, not what it points at. Without this, any store
 * member could link their product to another store's team/collection/
 * competition (team ids are publicly enumerable via
 * `teams_public_read_active`). See plans/002-cross-store-reference-ownership-check.md.
 */
async function verifyReferencesOwnedByStore(
  supabase: SupabaseServerClient,
  storeId: string,
  refs: { team_id?: string; collection_id?: string | null; competition_id?: string | null },
): Promise<string | null> {
  if (refs.team_id) {
    const { data } = await supabase
      .from("teams")
      .select("id")
      .eq("id", refs.team_id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) return "Time inválido.";
  }
  if (refs.collection_id) {
    const { data } = await supabase
      .from("collections")
      .select("id")
      .eq("id", refs.collection_id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) return "Coleção inválida.";
  }
  if (refs.competition_id) {
    const { data } = await supabase
      .from("competitions")
      .select("id")
      .eq("id", refs.competition_id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) return "Competição inválida.";
  }
  return null;
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  // team_id (and, if set, collection_id/competition_id) must belong to this
  // store. See verifyReferencesOwnedByStore above — FK constraints alone
  // don't check tenant ownership because they bypass RLS on the
  // referenced table.
  const referenceError = await verifyReferencesOwnedByStore(supabase, store.id, {
    team_id: parsed.data.team_id,
    collection_id: parsed.data.collection_id,
    competition_id: parsed.data.competition_id,
  });
  if (referenceError) return actionError(referenceError);

  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, store_id: store.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return actionError("Já existe um produto com esse slug.");
    if (error.code === "23503") return actionError("Time, coleção ou competição inválidos.");
    return actionError(`Não foi possível criar o produto: ${error.message}`);
  }

  revalidatePath("/admin/produtos");
  return actionOk({ id: data.id });
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  const parsed = productInputSchema.partial().safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const referenceError = await verifyReferencesOwnedByStore(supabase, store.id, {
    team_id: parsed.data.team_id,
    collection_id: parsed.data.collection_id,
    competition_id: parsed.data.competition_id,
  });
  if (referenceError) return actionError(referenceError);

  const { error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) {
    if (error.code === "23505") return actionError("Já existe um produto com esse slug.");
    if (error.code === "23503") return actionError("Time, coleção ou competição inválidos.");
    return actionError(`Não foi possível atualizar o produto: ${error.message}`);
  }

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}`);
  return actionOk(undefined);
}

/**
 * Covers every status-only transition in TASKS.md Phase 2 / Products:
 * "Save product as draft", "Publish product", "Mark sold out",
 * "Hide product" — all are just `status` writes to the same column.
 */
export async function setProductStatus(id: string, status: ProductStatus): Promise<ActionResult> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return actionError(`Não foi possível atualizar o status: ${error.message}`);

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}`);
  return actionOk(undefined);
}

/**
 * PRD §16 — duplicates classification + price configuration only. Images,
 * stock (product_sizes) and AI assets are deliberately never copied; see
 * src/domain/product.ts for exactly which fields transfer.
 */
export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  const { data: source, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (fetchError) return actionError(`Não foi possível carregar o produto: ${fetchError.message}`);
  if (!source) return actionError("Produto não encontrado.");

  const duplicateInput = buildDuplicateProductInput(source);

  const { data, error } = await supabase
    .from("products")
    .insert(duplicateInput)
    .select("id")
    .single();

  if (error) return actionError(`Não foi possível duplicar o produto: ${error.message}`);

  revalidatePath("/admin/produtos");
  return actionOk({ id: data.id });
}
