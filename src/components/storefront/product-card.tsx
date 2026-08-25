import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getPriceDisplay } from "@/domain/price";
import type { PublicProductRow } from "@/lib/queries/public-products";

/**
 * `product.product_images[0]` (present since Phase 5 — see the ordering
 * comment on `PublicProductRow`) is always the primary/cover image when
 * the product has any photo at all. Falls back to the "Sem foto"
 * placeholder for a product with no photos yet. Storage URLs are on
 * `*.supabase.co`, which `next.config.ts` already whitelists for
 * `next/image` — unlike `logo_url` (an arbitrary admin-entered URL), so
 * this gets real optimization/lazy-loading instead of a plain `<img>`.
 */
export function ProductCard({ product }: { product: PublicProductRow }) {
  const cover = product.product_images[0] ?? null;
  const display = getPriceDisplay({
    price: product.price,
    promotionalPrice: product.promotional_price,
    priceDisplayMode: product.price_display_mode,
  });

  return (
    <Link href={`/produto/${product.slug}`} className="group block h-full">
      <div className="h-full overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/5 group-hover:-translate-y-0.5">
        <div className="bg-muted relative aspect-square overflow-hidden" aria-hidden="true">
          {cover ? (
            <Image
              src={cover.url}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-xs">Sem foto</span>
            </div>
          )}
          {product.status === "sold_out" ? (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="warning" className="shadow-sm">Esgotado</Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 p-3">
          <div className="space-y-0.5">
            <p className="truncate text-sm font-semibold leading-snug">{product.name}</p>
            {product.teams?.name ? (
              <p className="text-muted-foreground truncate text-xs">{product.teams.name}</p>
            ) : null}
          </div>

          {display.mode !== "hidden" ? (
            <div className="space-y-0.5">
              {display.mode === "consult" ? (
                <p className="text-xs text-muted-foreground">{display.label}</p>
              ) : (
                <>
                  {display.originalLabel ? (
                    <p className="text-muted-foreground text-xs line-through">De: {display.originalLabel}</p>
                  ) : null}
                  <p className="text-sm font-bold text-foreground">
                    {display.originalLabel ? "A partir de " : ""}{display.label}
                  </p>
                </>
              )}
            </div>
          ) : null}

          <div className="bg-accent/10 text-accent mt-auto flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors group-hover:bg-accent/20">
            Ver mais
          </div>
        </div>
      </div>
    </Link>
  );
}
