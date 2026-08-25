"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/types/database";
import {
  addProductSize,
  removeProductSize,
  setProductSizeActive,
  updateProductSizeQuantity,
} from "@/lib/actions/product-sizes";

type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];

/**
 * PRD §15 Etapa 4 "tamanhos" / "estoque opcional". Lives on the product
 * edit screen (not the creation wizard) because `product_sizes.product_id`
 * requires the product to already exist.
 */
export function ProductSizesManager({
  productId,
  initialSizes,
}: {
  productId: string;
  initialSizes: ProductSizeRow[];
}) {
  const router = useRouter();
  const [sizes, setSizes] = useState(initialSizes);
  const [newSize, setNewSize] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newSize.trim()) return;
    setIsAdding(true);
    setError(null);

    const result = await addProductSize(productId, {
      size: newSize.trim(),
      quantity: newQuantity === "" ? null : Number(newQuantity),
      active: true,
    });

    setIsAdding(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setNewSize("");
    setNewQuantity("");
    router.refresh();
  }

  async function handleRemove(sizeId: string) {
    setPendingId(sizeId);
    setError(null);
    const result = await removeProductSize(sizeId, productId);
    setPendingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSizes((prev) => prev.filter((size) => size.id !== sizeId));
  }

  async function handleToggleActive(sizeId: string, active: boolean) {
    setSizes((prev) => prev.map((size) => (size.id === sizeId ? { ...size, active } : size)));
    const result = await setProductSizeActive(sizeId, productId, active);
    if (!result.ok) {
      setError(result.error);
      setSizes((prev) => prev.map((size) => (size.id === sizeId ? { ...size, active: !active } : size)));
    }
  }

  async function handleQuantityChange(sizeId: string, rawValue: string) {
    const quantity = rawValue === "" ? null : Number(rawValue);
    setSizes((prev) => prev.map((size) => (size.id === sizeId ? { ...size, quantity } : size)));
    const result = await updateProductSizeQuantity(sizeId, productId, quantity);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="space-y-3">
      {sizes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum tamanho cadastrado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {sizes.map((size) => (
            <li key={size.id} className="border-border flex items-center gap-2 rounded-md border p-2">
              <span className="w-12 shrink-0 font-medium">{size.size}</span>
              <Input
                type="number"
                min={0}
                placeholder="Estoque"
                className="h-9"
                value={size.quantity ?? ""}
                onChange={(event) => handleQuantityChange(size.id, event.target.value)}
              />
              <Switch
                aria-label={`Tamanho ${size.size} ativo`}
                checked={size.active}
                onChange={(event) => handleToggleActive(size.id, event.target.checked)}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={pendingId === size.id}
                onClick={() => handleRemove(size.id)}
                aria-label={`Remover tamanho ${size.size}`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="new_size">Tamanho</Label>
          <Input
            id="new_size"
            className="w-20"
            placeholder="Ex.: M"
            value={newSize}
            onChange={(event) => setNewSize(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new_quantity">Estoque (opcional)</Label>
          <Input
            id="new_quantity"
            type="number"
            min={0}
            className="w-24"
            value={newQuantity}
            onChange={(event) => setNewQuantity(event.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={isAdding || !newSize.trim()}>
          {isAdding ? "Adicionando..." : "Adicionar"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
