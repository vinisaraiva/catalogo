"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useSelection } from "@/components/storefront/selection-provider";
import { buildSingleProductMessage, buildWhatsappUrl } from "@/domain/whatsapp";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriceDisplayMode } from "@/types/database";

interface SizeOption {
  id: string;
  size: string;
  active: boolean;
  quantity: number | null;
}

/**
 * Product page's size picker + "add to selection" + direct WhatsApp CTA,
 * combined into one Client Component per ARCHITECTURE.md §17 ("size
 * selection" and "local WhatsApp selection basket" are both listed as
 * client-only responsibilities, and both need the same chosen size here).
 *
 * The WhatsApp CTA's wording mirrors `domain/price.ts`'s own consult
 * copy ("Consultar pelo WhatsApp") for `consult` mode; a generic "Falar
 * no WhatsApp" is used otherwise, since this component doesn't need the
 * full price to build its message and shouldn't have to fetch it just
 * for a label.
 */
export function ProductSizeSelector({
  productId,
  productName,
  productUrl,
  priceDisplayMode,
  sizes,
  whatsappNumber,
}: {
  productId: string;
  productName: string;
  productUrl: string;
  priceDisplayMode: PriceDisplayMode;
  sizes: SizeOption[];
  whatsappNumber: string | null;
}) {
  const { addItem, removeItem, isSelected } = useSelection();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const hasSizes = sizes.length > 0;
  const canAdd = !hasSizes || selectedSize !== null;
  const alreadyAdded = isSelected(productId, selectedSize);

  const message = buildSingleProductMessage({ productName, size: selectedSize, priceDisplayMode });
  const whatsappHref = whatsappNumber ? buildWhatsappUrl(whatsappNumber, message) : null;

  return (
    <div className="space-y-4">
      {hasSizes ? (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tamanhos</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Escolha o tamanho">
            {sizes.map((size) => {
              const available = size.active && size.quantity !== 0;
              const selected = selectedSize === size.size;
              return (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!available}
                  onClick={() =>
                    setSelectedSize((current) => (current === size.size ? null : size.size))
                  }
                  className={cn(
                    "h-11 min-w-[2.75rem] rounded-xl border-2 px-3 text-sm font-semibold transition-all duration-150",
                    !available &&
                      "border-border/50 text-muted-foreground cursor-not-allowed line-through opacity-50",
                    available && selected && "border-accent bg-accent text-accent-foreground shadow-md shadow-accent/20",
                    available && !selected && "border-border/60 hover:border-accent/40 hover:bg-muted/50",
                  )}
                >
                  {size.size}
                </button>
              );
            })}
          </div>
          {!selectedSize ? (
            <p className="text-muted-foreground text-xs">Escolha um tamanho para continuar.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant={alreadyAdded ? "secondary" : "outline"}
          disabled={!canAdd}
          className="h-12 flex-1 rounded-xl font-semibold"
          onClick={() => {
            if (alreadyAdded) {
              removeItem(productId, selectedSize);
            } else {
              addItem({ productId, productName, productUrl, size: selectedSize });
            }
          }}
        >
          {alreadyAdded ? "Remover da seleção" : "Adicionar à seleção"}
        </Button>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 flex-1 rounded-xl bg-[#25d366] font-semibold text-white shadow-lg shadow-[#25d366]/25 hover:bg-[#20ba5c]",
            )}
          >
            <MessageCircle aria-hidden="true" />
            {priceDisplayMode === "consult" ? "Consultar pelo WhatsApp" : "Falar no WhatsApp"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
