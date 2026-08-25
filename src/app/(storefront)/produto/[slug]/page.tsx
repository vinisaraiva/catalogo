import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublicEnv } from "@/lib/env";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { getPublicProductBySlug, listRelatedProducts } from "@/lib/queries/public-products";
import { listProductSizes } from "@/lib/queries/products";
import { PriceBlock } from "@/components/storefront/price-block";
import { ProductSizeSelector } from "@/components/storefront/product-size-selector";
import { ProductCard } from "@/components/storefront/product-card";
import { Badge } from "@/components/ui/badge";

/**
 * PRD §20 "Página de produto". Gallery shows `product.product_images`
 * (Phase 5) — the primary image large, plus a static thumbnail strip when
 * there's more than one; falls back to the "Sem foto" placeholder for a
 * product with no photos yet. This is intentionally view-only (no
 * click-to-swap lightbox): TASKS.md Phase 5's own checklist is entirely
 * admin-side (upload/reorder/delete), and a richer public gallery isn't
 * asked for by any phase yet — see DECISIONS.md ADR-027. Size selection,
 * "add to selection" and the direct WhatsApp CTA are all handled by
 * `ProductSizeSelector` (TASKS.md Phase 4 — see DECISIONS.md ADR-026).
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefrontStore();

  const product = await getPublicProductBySlug(store.id, slug);
  if (!product) notFound();

  const [sizes, related] = await Promise.all([
    listProductSizes(store.id, product.id),
    listRelatedProducts(store.id, product),
  ]);

  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  const productUrl = NEXT_PUBLIC_APP_URL ? `${NEXT_PUBLIC_APP_URL}/produto/${product.slug}` : "";
  const coverImage = product.product_images[0] ?? null;

  return (
    <div className="space-y-6">
      {coverImage ? (
        <div className="space-y-3">
          <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={coverImage.url}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 480px, 100vw"
              priority
              className="object-cover"
            />
          </div>
          {product.product_images.length > 1 ? (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {product.product_images.map((image) => (
                <div
                  key={image.url}
                  className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-transparent transition-colors"
                >
                  <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className="bg-muted flex aspect-square items-center justify-center rounded-2xl"
          aria-hidden="true"
        >
          <span className="text-muted-foreground text-sm">Sem foto</span>
        </div>
      )}

      <div className="space-y-3">
        {product.status === "sold_out" ? <Badge variant="warning">Esgotado</Badge> : null}
        <h1 className="text-xl font-bold tracking-tight">{product.name}</h1>
        {product.teams ? (
          <Link
            href={`/time/${product.teams.slug}`}
            className="text-accent inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
          >
            {product.teams.name}
          </Link>
        ) : null}
        <PriceBlock
          price={product.price}
          promotionalPrice={product.promotional_price}
          priceDisplayMode={product.price_display_mode}
          className="text-lg"
        />
      </div>

      <ProductSizeSelector
        productId={product.id}
        productName={product.name}
        productUrl={productUrl}
        priceDisplayMode={product.price_display_mode}
        sizes={sizes}
        whatsappNumber={store.whatsapp_number}
      />

      {product.description ? (
        <div className="rounded-xl bg-muted/50 p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição</h2>
          <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">{product.description}</p>
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Produtos relacionados</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
