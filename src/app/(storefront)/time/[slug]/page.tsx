import { notFound } from "next/navigation";
import Link from "next/link";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { getTeamBySlug } from "@/lib/queries/teams";
import { listPublicProducts } from "@/lib/queries/public-products";
import { ProductCard } from "@/components/storefront/product-card";
import { cn } from "@/lib/utils";

const TEAM_TYPE_LABEL: Record<string, string> = {
  club: "Clube",
  national_team: "Seleção",
};

/**
 * PRD §18 "Página de time". Filters are generated from whatever
 * collection/competition/season combinations actually appear on this
 * team's published products — not a fixed category tree (CLAUDE.md
 * "Product classification rules") — encoded as one `?f=kind:slugOrValue`
 * param so the chip row can mix collection, competition and season
 * options the way PRD §18's own example list does ("Todos, Atual, Retrô,
 * Libertadores, Treino, ...").
 */
export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { slug } = await params;
  const { f } = await searchParams;
  const store = await getStorefrontStore();

  const team = await getTeamBySlug(store.id, slug);
  if (!team) notFound();

  const allProducts = await listPublicProducts(store.id, { teamId: team.id, limit: 200 });

  const filters: { kind: string; value: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const product of allProducts) {
    if (product.collections && !seen.has(`collection:${product.collections.slug}`)) {
      seen.add(`collection:${product.collections.slug}`);
      filters.push({
        kind: "collection",
        value: product.collections.slug,
        label: product.collections.name,
      });
    }
    if (product.competitions && !seen.has(`competition:${product.competitions.slug}`)) {
      seen.add(`competition:${product.competitions.slug}`);
      filters.push({
        kind: "competition",
        value: product.competitions.slug,
        label: product.competitions.name,
      });
    }
    if (product.season && !seen.has(`season:${product.season}`)) {
      seen.add(`season:${product.season}`);
      filters.push({ kind: "season", value: product.season, label: product.season });
    }
  }

  const [activeKind, activeValue] = f ? f.split(":") : [undefined, undefined];
  const filteredProducts = f
    ? allProducts.filter((product) => {
        if (activeKind === "collection") return product.collections?.slug === activeValue;
        if (activeKind === "competition") return product.competitions?.slug === activeValue;
        if (activeKind === "season") return product.season === activeValue;
        return true;
      })
    : allProducts;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {team.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, not a known image host
          <img src={team.logo_url} alt="" className="h-12 w-12 object-contain" />
        ) : (
          <div className="bg-muted h-12 w-12 rounded-full" aria-hidden="true" />
        )}
        <div>
          <h1 className="text-lg font-semibold">{team.name}</h1>
          <p className="text-muted-foreground text-xs">
            {TEAM_TYPE_LABEL[team.type] ?? team.type} · {allProducts.length}{" "}
            {allProducts.length === 1 ? "produto" : "produtos"}
          </p>
        </div>
      </div>

      {filters.length > 0 ? (
        <div className="flex gap-1 overflow-x-auto">
          <Link
            href={`/time/${slug}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
              !f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground",
            )}
          >
            Todos
          </Link>
          {filters.map((filter) => (
            <Link
              key={`${filter.kind}:${filter.value}`}
              href={`/time/${slug}?f=${filter.kind}:${encodeURIComponent(filter.value)}`}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                activeKind === filter.kind && activeValue === filter.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      ) : null}

      {filteredProducts.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
