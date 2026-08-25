import type { PriceDisplayMode } from "@/types/database";

export interface PriceDisplayInput {
  price: number | null;
  promotionalPrice: number | null;
  priceDisplayMode: PriceDisplayMode;
  currency?: string;
}

export type PriceDisplay =
  | { mode: "hidden" }
  | { mode: "consult"; label: string; whatsappCta: string }
  | {
      mode: "show_price";
      label: string;
      originalLabel: string | null;
      hasPromotion: boolean;
    };

/**
 * Pure formatting of a product's price block per PRD §21 / CLAUDE.md
 * "Price display":
 *
 * - show_price: show the price (promotional price wins when set, with the
 *   original price kept as a struck-through reference).
 * - consult: never show a number — "Consultar valor" + a WhatsApp CTA.
 * - hidden: no price block at all (callers should render nothing).
 *
 * No component/formatting logic lives here beyond the currency mask, so
 * this stays easy to unit test independent of React.
 */
export function getPriceDisplay(input: PriceDisplayInput): PriceDisplay {
  const { price, promotionalPrice, priceDisplayMode, currency = "BRL" } = input;

  if (priceDisplayMode === "hidden") {
    return { mode: "hidden" };
  }

  if (priceDisplayMode === "consult") {
    return {
      mode: "consult",
      label: "Consultar valor",
      whatsappCta: "Consultar pelo WhatsApp",
    };
  }

  // show_price
  const effectivePrice =
    promotionalPrice != null && promotionalPrice >= 0 && promotionalPrice < (price ?? Infinity)
      ? promotionalPrice
      : price;

  if (effectivePrice == null) {
    // Misconfigured product (show_price with no price set). Fail safe to
    // "consult" behavior rather than rendering "R$ NaN" or nothing at all.
    return {
      mode: "consult",
      label: "Consultar valor",
      whatsappCta: "Consultar pelo WhatsApp",
    };
  }

  const hasPromotion = effectivePrice === promotionalPrice && price != null && effectivePrice < price;

  return {
    mode: "show_price",
    label: formatCurrency(effectivePrice, currency),
    originalLabel: hasPromotion && price != null ? formatCurrency(price, currency) : null,
    hasPromotion,
  };
}

export function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}
