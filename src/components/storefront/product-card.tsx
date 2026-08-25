import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PriceBlock } from "@/components/storefront/price-block";
import type { PublicProductRow } from "@/lib/queries/public-products";

/**
 * `product.product_images[0]` (present since Phase 5 — see the ordering
 * comment on `PublicProductRow`) is always the primary/cover image when
 * the product has any photo at all. Falls back to the "Sem foto"
 * placeholder for a product with no photos yet. Storage URLs are on
 * `*.supabase.co`, which `next.config.ts` already whitelists for
 * `next/image` — unlike `logo_url` (an arbitrary admin-entered URL), so
 * this gets real optimization/lazy-loading instead of a plain `<img>`.
 *
 * "Esgotado" renders as a diagonal corner ribbon over the photo (a
 * classic stamped-tag treatment) instead of a plain badge — the photo is
 * the card's main real estate, so the status reads at a glance without
 * competing with the product name/price line below it.
 */
export function ProductCard({ product }: { product: PublicProductRow }) {
  const cover = product.product_images[0] ?? null;
  const soldOut = product.status === "sold_out";

  return (
    <Link href={`/produto/${product.slug}`} className="group block h-full">
      <Card className="border-border/60 h-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:border-primary/30 group-active:scale-[0.98]">
        <div className="bg-muted relative aspect-square overflow-hidden" aria-hidden="true">
          {cover ? (
            <Image
              src={cover.url}
              alt=""
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-xs">Sem foto</span>
            </div>
          )}
          {soldOut ? (
            <span className="bg-destructive text-destructive-foreground absolute top-3 -right-8 w-32 rotate-45 py-1 text-center text-[10px] font-bold tracking-wider uppercase shadow-sm">
              Esgotado
            </span>
          ) : null}
        </div>
        <CardContent className="space-y-1 p-3">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-muted-foreground truncate text-xs">{product.teams?.name ?? ""}</p>
          <PriceBlock
            price={product.price}
            promotionalPrice={product.promotional_price}
            priceDisplayMode={product.price_display_mode}
            className="text-base"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
