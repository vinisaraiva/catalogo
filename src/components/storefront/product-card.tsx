import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
 */
export function ProductCard({ product }: { product: PublicProductRow }) {
  const cover = product.product_images[0] ?? null;

  return (
    <Link href={`/produto/${product.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden rounded-xl border-border/60 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/5 group-hover:-translate-y-0.5">
        <div className="bg-muted relative aspect-square overflow-hidden" aria-hidden="true">
          {cover ? (
            <Image
              src={cover.url}
              alt=""
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
        <CardContent className="space-y-1.5 p-3">
          <p className="truncate text-sm font-semibold leading-snug">{product.name}</p>
          <p className="text-muted-foreground truncate text-xs">{product.teams?.name ?? ""}</p>
          <PriceBlock
            price={product.price}
            promotionalPrice={product.promotional_price}
            priceDisplayMode={product.price_display_mode}
            className="text-sm"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
