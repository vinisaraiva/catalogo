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
    <Link href={`/produto/${product.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden">
        <div className="bg-muted relative aspect-square" aria-hidden="true">
          {cover ? (
            <Image
              src={cover.url}
              alt=""
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-xs">Sem foto</span>
            </div>
          )}
        </div>
        <CardContent className="space-y-1 p-3">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-muted-foreground truncate text-xs">{product.teams?.name ?? ""}</p>
          <div className="flex items-center justify-between gap-2">
            <PriceBlock
              price={product.price}
              promotionalPrice={product.promotional_price}
              priceDisplayMode={product.price_display_mode}
              className="text-sm"
            />
            {product.status === "sold_out" ? <Badge variant="warning">Esgotado</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
