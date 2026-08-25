"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/domain/slug";
import type { TeamType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createTeam, updateTeam } from "@/lib/actions/teams";

export interface TeamInitialData {
  id?: string;
  name: string;
  slug: string;
  type: TeamType;
  country: string | null;
  logo_url: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
}

export function TeamForm({ initialData }: { initialData?: TeamInitialData }) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));
  const [type, setType] = useState<TeamType>(initialData?.type ?? "club");
  const [country, setCountry] = useState(initialData?.country ?? "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
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

    const input = {
      name,
      slug,
      type,
      country: country || null,
      logo_url: logoUrl || null,
      featured,
      active,
      sort_order: sortOrder,
    };

    const result = initialData?.id
      ? await updateTeam(initialData.id, input)
      : await createTeam(input);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/admin/times");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
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
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" value={type} onChange={(e) => setType(e.target.value as TeamType)}>
          <option value="club">Clube</option>
          <option value="national_team">Seleção</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">País</Label>
        <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo_url">URL do escudo (opcional)</Label>
        <Input
          id="logo_url"
          type="url"
          placeholder="https://..."
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
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
        <Label htmlFor="featured">Destaque</Label>
        <Switch id="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
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
        {isSubmitting ? "Salvando..." : "Salvar time"}
      </Button>
    </form>
  );
}
