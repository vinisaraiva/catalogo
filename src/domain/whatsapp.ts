import type { PriceDisplayMode } from "@/types/database";

export interface SelectionItem {
  productId: string;
  productName: string;
  productUrl: string;
  size: string | null;
}

/**
 * Builds a WhatsApp click-to-chat URL per ARCHITECTURE.md §18 ("No
 * WhatsApp Business API in the MVP. Generate a normal click-to-chat URL
 * containing a properly encoded message."). `phoneNumber` may be stored
 * with formatting (spaces, dashes, parentheses, a leading "+") — only
 * digits matter for `wa.me`.
 */
export function buildWhatsappUrl(phoneNumber: string, message?: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/**
 * Single-product message per PRD §23 / CLAUDE.md "WhatsApp rules".
 * Wording depends on the product's `price_display_mode` — TASKS.md Phase
 * 4's "Respect `consult` wording" item:
 *
 * - `consult`: PRD §23's own example — "...e gostaria de consultar o
 *   tamanho G." The customer doesn't know the price yet, so the message
 *   reads as a question.
 * - `show_price` / `hidden`: ARCHITECTURE.md §18's example — "...e tenho
 *   interesse no tamanho G." The customer already has enough information
 *   (a visible price, or none shown at all), so this reads as purchase
 *   interest rather than a price query.
 *
 * `productUrl` is optional and left out of the message entirely when not
 * given — "include product URL where useful" (TASKS.md): not useful when
 * the CTA already lives on the product's own page (the customer is
 * already looking at it), but callers away from that page can still pass
 * one.
 */
export function buildSingleProductMessage(input: {
  productName: string;
  size?: string | null;
  priceDisplayMode: PriceDisplayMode;
  productUrl?: string | null;
}): string {
  const { productName, size, priceDisplayMode, productUrl } = input;

  const intent =
    priceDisplayMode === "consult"
      ? size
        ? `gostaria de consultar o tamanho ${size}`
        : "gostaria de consultar"
      : size
        ? `tenho interesse no tamanho ${size}`
        : "tenho interesse";

  const base = `Olá! Vi ${productName} no catálogo e ${intent}.`;
  return productUrl ? `${base}\n${productUrl}` : base;
}

/**
 * Multi-product message for the local selection basket, per PRD §22:
 * "abrir WhatsApp com mensagem contendo: produtos; tamanhos
 * selecionados; links." Unlike the single-product message, a link is
 * always included per item here (when the item has one) — with more
 * than one product in the same message, the link is how the seller
 * tells the items apart.
 */
export function buildSelectionMessage(items: SelectionItem[]): string {
  if (items.length === 0) return "";

  const intro =
    items.length === 1
      ? "Olá! Tenho interesse neste produto:"
      : "Olá! Tenho interesse nestes produtos:";

  const lines = items.map((item, index) => {
    const sizeLabel = item.size ? ` — tamanho ${item.size}` : "";
    const urlLine = item.productUrl ? `\n${item.productUrl}` : "";
    return `${index + 1}. ${item.productName}${sizeLabel}${urlLine}`;
  });

  return `${intro}\n\n${lines.join("\n\n")}`;
}
