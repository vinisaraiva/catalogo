"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/lib/actions/result";

export interface AiModelInitialData {
  id?: string;
  name: string;
  active: boolean;
  sort_order: number;
}

/**
 * Create/edit form for `ai_models` (PRD.md §10). Not `SimpleEntityForm`
 * (used by collections/competitions) because `ai_models` has no `slug`
 * field — it's an internal admin-only library, never a public filter, so
 * there's nothing for a slug to address.
 */
export function AiModelForm({
  initialData,
  redirectPath,
  createAction,
  updateAction,
}: {
  initialData?: AiModelInitialData;
  redirectPath: string;
  createAction: (input: unknown) => Promise<ActionResult<{ id: string }>>;
  updateAction: (id: string, input: unknown) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const input = { name, active, sort_order: sortOrder };

    if (initialData?.id) {
      const result = await updateAction(initialData.id, input);
      setIsSubmitting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(redirectPath);
    } else {
      const result = await createAction(input);
      setIsSubmitting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/ia/modelos/${result.data.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do modelo</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Modelo 1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">Ordem</Label>
        <Input
          id="sort_order"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="active">Ativo</Label>
        <Switch id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : "Salvar modelo"}
      </Button>
    </form>
  );
}
