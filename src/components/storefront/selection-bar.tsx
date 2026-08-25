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

  const label = `${items.length} ${items.length === 1 ? "camisa selecionada" : "camisas selecionadas"}`;
  const href = whatsappNumber
    ? buildWhatsappUrl(whatsappNumber, buildSelectionMessage(items))
    : null;

  return (
    <div className="border-border bg-background fixed inset-x-0 bottom-0 z-20 border-t shadow-lg">
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
                className="text-muted-foreground shrink-0"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex-1 truncate text-left text-sm font-medium underline-offset-2 hover:underline"
        >
          {label}
        </button>
        {expanded ? (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Limpar
          </Button>
        ) : null}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            <MessageCircle aria-hidden="true" /> Finalizar
          </a>
        ) : null}
      </div>
    </div>
  );
}
