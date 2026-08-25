import { slugify } from "./slug";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

/**
 * Fields copied into a duplicated product, per PRD §16 "Duplicação de
 * produto":
 *
 *   Duplicar: time; coleção; competição; tipo; preço; configurações.
 *   Não duplicar automaticamente: imagens; estoque; arte IA.
 *
 * "Não duplicar automaticamente" is satisfied structurally here: this
 * function only ever returns a `products` row. Callers must not copy
 * product_images or product_sizes rows — see the duplicateProduct server
 * action, which only inserts this row and nothing else.
 *
 * Assumptions (documented per CLAUDE.md "choose the simplest solution,
 * document important assumptions" — none of these are in the PRD):
 * - New duplicate always starts as `draft`, regardless of the source
 *   product's status, so a duplicate is never accidentally published.
 * - `featured` and `new_arrival` are reset to false — a duplicate isn't
 *   automatically promoted to the same merchandising slots as the
 *   original.
 * - Name gets a " (cópia)" suffix and the slug a numeric suffix, since
 *   `products.slug` is unique per store and the original slug is taken.
 */
export function buildDuplicateProductInput(
  source: ProductRow,
  options: { slugSuffix: string } = { slugSuffix: String(Date.now()).slice(-6) },
): ProductInsert {
  return {
    store_id: source.store_id,
    team_id: source.team_id,
    collection_id: source.collection_id,
    competition_id: source.competition_id,
    name: `${source.name} (cópia)`,
    slug: `${slugify(source.name)}-copia-${options.slugSuffix}`,
    season: source.season,
    model: source.model,
    product_type: source.product_type,
    description: source.description,
    price: source.price,
    promotional_price: source.promotional_price,
    price_display_mode: source.price_display_mode,
    status: "draft",
    featured: false,
    new_arrival: false,
    sort_order: source.sort_order,
  };
}
