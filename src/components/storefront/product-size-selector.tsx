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
    <div className="space-y-3">
      {hasSizes ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Tamanhos</h2>
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
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    !available &&
                      "border-border text-muted-foreground cursor-not-allowed line-through opacity-60",
                    available && selected && "border-primary bg-primary text-primary-foreground",
                    available && !selected && "border-border hover:bg-accent",
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
          className="flex-1"
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
            className={cn(buttonVariants({ variant: "default" }), "flex-1")}
          >
            <MessageCircle aria-hidden="true" />
            {priceDisplayMode === "consult" ? "Consultar pelo WhatsApp" : "Falar no WhatsApp"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
