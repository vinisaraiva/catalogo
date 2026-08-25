"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/types/database";
import { setProductStatus, duplicateProduct } from "@/lib/actions/products";

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Rascunho",
  active: "Publicado",
  sold_out: "Esgotado",
  hidden: "Oculto",
};

const STATUS_BADGE_VARIANT: Record<ProductStatus, "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  active: "success",
  sold_out: "warning",
  hidden: "destructive",
};

/**
 * PRD §15 Etapa 5 ("Publicação") status transitions plus PRD §16
 * ("Duplicação de produto"). "Gerar arte com IA" from the same Etapa 5 is
 * Phase 6/7 scope and intentionally not implemented here.
 */
export function ProductStatusActions({ productId, status }: { productId: string; status: ProductStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [isUpdating, setIsUpdating] = useState<ProductStatus | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(next: ProductStatus) {
    setIsUpdating(next);
    setError(null);
    const result = await setProductStatus(productId, next);
    setIsUpdating(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCurrent(next);
    router.refresh();
  }

  async function handleDuplicate() {
    setIsDuplicating(true);
    setError(null);
    const result = await duplicateProduct(productId);
    setIsDuplicating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(`/admin/produtos/${result.data.id}`);
    router.refresh();
  }

  const statusOptions: ProductStatus[] = ["draft", "active", "sold_out", "hidden"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status</span>
        <Badge variant={STATUS_BADGE_VARIANT[current]}>{STATUS_LABEL[current]}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions
          .filter((option) => option !== current)
          .map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="outline"
              disabled={isUpdating !== null}
              onClick={() => handleStatusChange(option)}
            >
              {isUpdating === option ? "Salvando..." : STATUS_LABEL[option]}
            </Button>
          ))}
      </div>

      <Button type="button" size="sm" variant="secondary" disabled={isDuplicating} onClick={handleDuplicate}>
        <Copy /> {isDuplicating ? "Duplicando..." : "Duplicar produto"}
      </Button>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
