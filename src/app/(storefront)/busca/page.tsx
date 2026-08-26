import { notFound } from "next/navigation";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { listPublicProducts, searchPublicProducts } from "@/lib/queries/public-products";
import { getCompetitionBySlug } from "@/lib/queries/competitions";
import { ProductCard } from "@/components/storefront/product-card";
import { SearchBar } from "@/components/storefront/search-bar";

/**
 * PRD §19 "Busca". Not in ARCHITECTURE.md's suggested route list (only
 * `/`, `/time/[slug]`, `/produto/[slug]` are listed there), but the PRD
 * and TASKS.md Phase 3 both require search as a first-class feature — see
 * DECISIONS.md ADR-025 for this route addition.
 *
 * `?competition=slug` (DECISIONS.md ADR-032) reuses this same route for
 * Home's "Categorias" tiles — browsing by competition (Brasileirão,
 * Libertadores, ...) is filtering, same as a text search, just by a
 * different key; a dedicated `/categoria/[slug]` route for one filter axis
 * would just be `time/[slug]`'s pattern duplicated for no real benefit.
 * `q` wins if both are somehow present — free-text search is the more
 * specific intent.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; competition?: string }>;
}) {
  const { q, competition: competitionSlug } = await searchParams;
  const query = (q ?? "").trim();
  const store = await getStorefrontStore();

  const competition =
    !query && competitionSlug ? await getCompetitionBySlug(store.id, competitionSlug) : null;
  if (!query && competitionSlug && !competition) notFound();

  const products = query
    ? await searchPublicProducts(store.id, query)
    : competition
      ? await listPublicProducts(store.id, { competitionId: competition.id, limit: 48 })
      : [];

  const heading = query
    ? `Resultados para "${query}"`
    : competition
      ? `Camisas — ${competition.name}`
      : "Buscar";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl tracking-wide uppercase">{heading}</h1>

      <SearchBar defaultValue={query} />

      {!query && !competition ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Digite o nome de um produto, time, coleção, competição ou temporada.
        </p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {query
            ? <>Nenhum resultado encontrado para &quot;{query}&quot;.</>
            : "Nenhum produto encontrado nessa categoria ainda."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
