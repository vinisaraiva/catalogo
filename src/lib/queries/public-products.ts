import "server-only";
import { createClient } from "@/lib/supabase/server";
import { escapePostgrestFilterValue } from "@/domain/postgrest-filter";
import type { Database } from "@/types/database";

export type PublicProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  teams: { id: string; name: string; slug: string } | null;
  collections: { id: string; name: string; slug: string } | null;
  competitions: { id: string; name: string; slug: string } | null;
  // Ordered ascending by sort_order (see `.order(..., { foreignTable:
  // "product_images" })` below) — [0], when present, is always the
  // primary/cover image (Phase 5's "select primary image" is implemented
  // as "move to sort_order 0"; see DECISIONS.md ADR-027). Empty until a
  // product has at least one uploaded photo.
  product_images: { url: string; sort_order: number }[];
};

export interface PublicProductFilter {
  teamId?: string;
  collectionId?: string;
  competitionId?: string;
  season?: string;
  featured?: boolean;
  newArrival?: boolean;
  hasPromotion?: boolean;
  limit?: number;
}

const PUBLIC_PRODUCT_SELECT =
  "*, teams(id, name, slug), collections(id, name, slug), competitions(id, name, slug), product_images(url, sort_order)";

/**
 * Every function here reads through the RLS-scoped client (anon role for
 * an unauthenticated request), so `products_public_read_published` always
 * narrows results to `status in ('active', 'sold_out')` for a store that
 * is itself `active` — regardless of which filters are passed below. The
 * filters here are about which *published* products to show, never about
 * re-exposing draft/hidden ones.
 */
export async function listPublicProducts(
  storeId: string,
  filter: PublicProductFilter = {},
): Promise<PublicProductRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .order("sort_order", { foreignTable: "product_images", ascending: true });

  if (filter.teamId) query = query.eq("team_id", filter.teamId);
  if (filter.collectionId) query = query.eq("collection_id", filter.collectionId);
  if (filter.competitionId) query = query.eq("competition_id", filter.competitionId);
  if (filter.season) query = query.eq("season", filter.season);
  if (filter.featured) query = query.eq("featured", true);
  if (filter.newArrival) query = query.eq("new_arrival", true);
  if (filter.hasPromotion) query = query.not("promotional_price", "is", null);
  if (filter.limit) query = query.limit(filter.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list public products: ${error.message}`);
  return (data ?? []) as unknown as PublicProductRow[];
}

export async function getPublicProductBySlug(
  storeId: string,
  slug: string,
): Promise<PublicProductRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("store_id", storeId)
    .eq("slug", slug)
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .maybeSingle();

  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data as unknown as PublicProductRow | null;
}

export async function listRelatedProducts(
  storeId: string,
  product: Pick<PublicProductRow, "id" | "team_id">,
  limit = 4,
): Promise<PublicProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("store_id", storeId)
    .eq("team_id", product.team_id)
    .neq("id", product.id)
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to load related products: ${error.message}`);
  return (data ?? []) as unknown as PublicProductRow[];
}

/**
 * PRD §19 "Busca": search by product name, team, collection, competition
 * or season. No AI/fuzzy matching in the MVP ("Não usar IA no MVP para
 * busca") — plain `ilike` substring matching. Team/collection/competition
 * names live in joined tables that PostgREST's `.or()` can't filter
 * directly, so this resolves matching ids from those tables first, then
 * ORs them against the product's own text fields in one query.
 */
export async function searchPublicProducts(
  storeId: string,
  searchQuery: string,
  limit = 24,
): Promise<PublicProductRow[]> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const term = `%${trimmed}%`;

  const [{ data: teamMatches }, { data: collectionMatches }, { data: competitionMatches }] =
    await Promise.all([
      supabase.from("teams").select("id").eq("store_id", storeId).ilike("name", term),
      supabase.from("collections").select("id").eq("store_id", storeId).ilike("name", term),
      supabase.from("competitions").select("id").eq("store_id", storeId).ilike("name", term),
    ]);

  // `term` is user-supplied — escape it before splicing into the .or()
  // filter string so a comma/paren in the search text can't break or
  // smuggle extra clauses into the combined PostgREST expression (the
  // team/collection/competition id lists below are safe unescaped: they
  // come from our own prior queries, not from user input).
  const escapedTerm = escapePostgrestFilterValue(term);
  const orParts = [`name.ilike.${escapedTerm}`, `season.ilike.${escapedTerm}`];
  if (teamMatches?.length) orParts.push(`team_id.in.(${teamMatches.map((t) => t.id).join(",")})`);
  if (collectionMatches?.length) {
    orParts.push(`collection_id.in.(${collectionMatches.map((c) => c.id).join(",")})`);
  }
  if (competitionMatches?.length) {
    orParts.push(`competition_id.in.(${competitionMatches.map((c) => c.id).join(",")})`);
  }

  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("store_id", storeId)
    .or(orParts.join(","))
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to search products: ${error.message}`);
  return (data ?? []) as unknown as PublicProductRow[];
}
