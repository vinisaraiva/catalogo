import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { searchPublicProducts } from "@/lib/queries/public-products";
import { ProductCard } from "@/components/storefront/product-card";
import { SearchBar } from "@/components/storefront/search-bar";

/**
 * PRD §19 "Busca". Not in ARCHITECTURE.md's suggested route list (only
 * `/`, `/time/[slug]`, `/produto/[slug]` are listed there), but the PRD
 * and TASKS.md Phase 3 both require search as a first-class feature — see
 * DECISIONS.md ADR-025 for this route addition.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const store = await getStorefrontStore();
  const products = query ? await searchPublicProducts(store.id, query) : [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl tracking-wide uppercase">
        {query ? `Resultados para "${query}"` : "Buscar"}
      </h1>

      <SearchBar defaultValue={query} />

      {!query ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Digite o nome de um produto, time, coleção, competição ou temporada.
        </p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhum resultado encontrado para &quot;{query}&quot;.
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
