import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { getPublicEnv } from "@/lib/env";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { getPriceDisplay } from "@/domain/price";
import { buildSingleProductMessage, buildWhatsappUrl } from "@/domain/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicProductRow } from "@/lib/queries/public-products";

/**
 * Full-bleed photo card (DECISIONS.md ADR-032) — name, price and a direct
 * WhatsApp CTA all live in a gradient overlay on top of the photo itself,
 * instead of a photo-then-text-block stack. `aspect-[3/4]` on the *outer*
 * element (not a separate inner wrapper) is what keeps every card in a
 * grid row the exact same height without a `h-full` + stretch dance: an
 * aspect-ratio box in an equal-width grid column is naturally equal
 * height, so there's no gap below the photo for the text to float in.
 *
 * `getStorefrontStore()` is called again here even though every page that
 * renders this grid already called it — it's wrapped in React `cache()`
 * (see `lib/store/get-storefront-store.ts`), so this dedupes to the same
 * request instead of an extra round trip, and avoids threading
 * `whatsappNumber` through every caller.
 *
 * The WhatsApp CTA can't be a nested `<a>` inside the card's `<Link>`
 * (invalid HTML, and click handling gets ambiguous) — instead the `Link`
 * is an absolutely-positioned full-card hit target *behind* the visible
 * content (`z-0`), and the button sits on top (`z-[2]`) as a sibling, so
 * tapping the photo/name navigates to the product while tapping the
 * button opens WhatsApp instead. No `favorite`/heart button here on
 * purpose — CLAUDE.md rules out customer accounts for the MVP, and a
 * heart that doesn't actually save anywhere would be a lie.
 */
export async function ProductCard({ product }: { product: PublicProductRow }) {
  const cover = product.product_images[0] ?? null;
  const soldOut = product.status === "sold_out";

  const store = await getStorefrontStore();
  const display = getPriceDisplay({
    price: product.price,
    promotionalPrice: product.promotional_price,
    priceDisplayMode: product.price_display_mode,
  });

  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  // Per domain/whatsapp.ts's own rule: include the product URL when the
  // CTA lives away from the product's own page (it does here — this is a
  // grid card) so the seller can tell which item the customer means.
  const productUrl = NEXT_PUBLIC_APP_URL ? `${NEXT_PUBLIC_APP_URL}/produto/${product.slug}` : undefined;
  const message = buildSingleProductMessage({
    productName: product.name,
    priceDisplayMode: product.price_display_mode,
    productUrl,
  });
  const whatsappHref = store.whatsapp_number
    ? buildWhatsappUrl(store.whatsapp_number, message)
    : null;

  return (
    <div className="group border-border/60 bg-muted relative aspect-[3/4] w-full overflow-hidden rounded-lg border shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10">
      <Link
        href={`/produto/${product.slug}`}
        className="absolute inset-0 z-0"
        aria-label={product.name}
      />

      {cover ? (
        <Image
          src={cover.url}
          alt=""
          fill
          sizes="(min-width: 640px) 200px, 50vw"
          className="pointer-events-none object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
      ) : (
        <div className="pointer-events-none flex h-full items-center justify-center" aria-hidden="true">
          <span className="text-muted-foreground text-xs">Sem foto</span>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"
        aria-hidden="true"
      />

      {soldOut ? (
        <span className="bg-destructive text-destructive-foreground pointer-events-none absolute top-3 -right-8 w-32 rotate-45 py-1 text-center text-[10px] font-bold tracking-wider uppercase shadow-sm">
          Esgotado
        </span>
      ) : null}
      {display.mode === "show_price" && display.discountPercent ? (
        <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-black shadow-sm">
          -{display.discountPercent}%
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] space-y-1.5 p-3">
        <div>
          <p className="truncate text-xs font-bold tracking-wide text-white uppercase">
            {product.name}
          </p>
          <p className="truncate text-[11px] text-white/70">{product.teams?.name ?? ""}</p>
        </div>

        {display.mode === "consult" ? (
          <p className="text-price-on-photo text-sm font-semibold">{display.label}</p>
        ) : display.mode === "show_price" ? (
          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-display text-price-on-photo text-lg tracking-wide">
              {display.label}
            </span>
            {display.originalLabel ? (
              <span className="text-xs text-white/50 line-through">{display.originalLabel}</span>
            ) : null}
          </p>
        ) : null}

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "whatsapp", size: "sm" }),
              "pointer-events-auto relative z-[2] w-full",
            )}
          >
            <MessageCircle className="size-3.5" aria-hidden="true" /> Falar no WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
