"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/domain/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/lib/actions/result";

export interface SimpleEntityInitialData {
  id?: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
}

/**
 * Shared create/edit form for `collections` and `competitions` — both are
 * the same shape (name, slug, active, sort_order). `teams` has extra
 * fields, so it gets its own form (team-form.tsx).
 */
export function SimpleEntityForm({
  entityLabel,
  initialData,
  redirectPath,
  createAction,
  updateAction,
}: {
  entityLabel: string;
  initialData?: SimpleEntityInitialData;
  redirectPath: string;
  createAction: (input: unknown) => Promise<ActionResult<{ id: string }>>;
  updateAction: (id: string, input: unknown) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));
  const [active, setActive] = useState(initialData?.active ?? true);
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const input = { name, slug, active, sort_order: sortOrder };
    const result = initialData?.id
      ? await updateAction(initialData.id, input)
      : await createAction(input);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(redirectPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
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
        {isSubmitting ? "Salvando..." : `Salvar ${entityLabel}`}
      </Button>
    </form>
  );
}
