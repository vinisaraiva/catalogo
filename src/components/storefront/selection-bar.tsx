"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useSelection } from "@/components/storefront/selection-provider";
import { buildSelectionMessage, buildWhatsappUrl } from "@/domain/whatsapp";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * PRD §22 "Seleção de produtos": a persistent count ("2 camisas
 * selecionadas") plus a way to open WhatsApp with every selected
 * product's name, size and link in one message ("Ao finalizar: abrir
 * WhatsApp com mensagem contendo: produtos; tamanhos selecionados;
 * links"). Renders nothing while the selection is empty.
 */
export function SelectionBar({ whatsappNumber }: { whatsappNumber: string | null }) {
  const { items, removeItem, clear } = useSelection();
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const href = whatsappNumber
    ? buildWhatsappUrl(whatsappNumber, buildSelectionMessage(items))
    : null;

  return (
    <div className="border-border bg-popover animate-selection-bar-in fixed inset-x-0 bottom-0 z-20 border-t shadow-lg">
      {expanded ? (
        <ul className="max-h-60 space-y-2 overflow-y-auto px-4 py-3">
          {items.map((item) => (
            <li
              key={`${item.productId}:${item.size ?? ""}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate">
                {item.productName}
                {item.size ? ` — tamanho ${item.size}` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.productId, item.size)}
                aria-label={`Remover ${item.productName} da seleção`}
                // p-3.5 + -m-3.5: grows the tap target to 44x44 (CLAUDE.md's
                // "large touch targets on mobile") around the 16px icon
                // without shifting its visual position in the row.
                className="text-muted-foreground hover:text-destructive -m-3.5 shrink-0 p-3.5 transition-colors"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* items-stretch (not items-center): lets the count/toggle button
          below fill the row's full height instead of just its own text
          line — otherwise its actual tap target was only ~20px tall
          against a 68px-tall row (CLAUDE.md "large touch targets on
          mobile"). Limpar/Finalizar dropped their `size="sm"` (36px) for
          the same reason — both now the default 44px button height. */}
      <div className="flex items-stretch gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex flex-1 items-center truncate text-left text-sm font-medium underline-offset-2 hover:underline"
        >
          <span className="text-primary font-display mr-1.5 tracking-wide">{items.length}</span>
          {items.length === 1 ? "camisa selecionada" : "camisas selecionadas"}
        </button>
        {expanded ? (
          <Button type="button" variant="ghost" onClick={clear}>
            Limpar
          </Button>
        ) : null}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "whatsapp" }), "shrink-0")}
          >
            <MessageCircle aria-hidden="true" /> Finalizar
          </a>
        ) : null}
      </div>
    </div>
  );
}
