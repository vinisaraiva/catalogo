"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/domain/slug";
import type { PriceDisplayMode } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateProduct } from "@/lib/actions/products";
import type { WizardOption } from "@/components/admin/product-wizard";

export interface ProductEditInitialData {
  id: string;
  team_id: string;
  collection_id: string | null;
  competition_id: string | null;
  name: string;
  slug: string;
  season: string | null;
  model: string | null;
  product_type: string | null;
  description: string | null;
  price: number | null;
  promotional_price: number | null;
  price_display_mode: PriceDisplayMode;
  featured: boolean;
  new_arrival: boolean;
  sort_order: number;
}

/**
 * Full field edit for an existing product — covers PRD §15 Etapa 2
 * (Classificação) and Etapa 4 (Comercial, minus tamanhos/estoque, which
 * live in ProductSizesManager) in a single non-stepped form, since the
 * wizard step-by-step flow only applies to first-time creation.
 */
export function ProductEditForm({
  initialData,
  teams,
  collections,
  competitions,
}: {
  initialData: ProductEditInitialData;
  teams: WizardOption[];
  collections: WizardOption[];
  competitions: WizardOption[];
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(initialData.team_id);
  const [collectionId, setCollectionId] = useState(initialData.collection_id ?? "");
  const [competitionId, setCompetitionId] = useState(initialData.competition_id ?? "");
  const [season, setSeason] = useState(initialData.season ?? "");
  const [model, setModel] = useState(initialData.model ?? "");
  const [productType, setProductType] = useState(initialData.product_type ?? "");
  const [name, setName] = useState(initialData.name);
  const [slug, setSlug] = useState(initialData.slug);
  const [description, setDescription] = useState(initialData.description ?? "");
  const [price, setPrice] = useState(initialData.price != null ? String(initialData.price) : "");
  const [promotionalPrice, setPromotionalPrice] = useState(
    initialData.promotional_price != null ? String(initialData.promotional_price) : "",
  );
  const [priceDisplayMode, setPriceDisplayMode] = useState<PriceDisplayMode>(initialData.price_display_mode);
  const [featured, setFeatured] = useState(initialData.featured);
  const [newArrival, setNewArrival] = useState(initialData.new_arrival);
  const [sortOrder, setSortOrder] = useState(initialData.sort_order);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const input = {
      team_id: teamId,
      collection_id: collectionId || null,
      competition_id: competitionId || null,
      season: season || null,
      model: model || null,
      product_type: productType || null,
      name,
      slug,
      description: description || null,
      price: price === "" ? null : Number(price),
      promotional_price: promotionalPrice === "" ? null : Number(promotionalPrice),
      price_display_mode: priceDisplayMode,
      featured,
      new_arrival: newArrival,
      sort_order: sortOrder,
    };

    const result = await updateProduct(initialData.id, input);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team_id">Time</Label>
        <Select id="team_id" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection_id">Coleção (opcional)</Label>
        <Select id="collection_id" value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
          <option value="">Nenhuma</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="competition_id">Competição (opcional)</Label>
        <Select id="competition_id" value={competitionId} onChange={(event) => setCompetitionId(event.target.value)}>
          <option value="">Nenhuma</option>
          {competitions.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="season">Temporada</Label>
          <Input id="season" value={season} onChange={(event) => setSeason(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={model} onChange={(event) => setModel(event.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_type">Tipo</Label>
        <Input id="product_type" value={productType} onChange={(event) => setProductType(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(event) => setSlug(slugify(event.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea id="description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">Preço</Label>
          <Input id="price" type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promotional_price">Preço promocional</Label>
          <Input
            id="promotional_price"
            type="number"
            min={0}
            step="0.01"
            value={promotionalPrice}
            onChange={(event) => setPromotionalPrice(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_display_mode">Exibição do preço</Label>
        <Select
          id="price_display_mode"
          value={priceDisplayMode}
          onChange={(event) => setPriceDisplayMode(event.target.value as PriceDisplayMode)}
        >
          <option value="show_price">Mostrar preço</option>
          <option value="consult">Consultar</option>
          <option value="hidden">Ocultar</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">Ordem</Label>
        <Input
          id="sort_order"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(Number(event.target.value))}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="featured">Destaque</Label>
        <Switch id="featured" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="new_arrival">Novidade</Label>
        <Switch id="new_arrival" checked={newArrival} onChange={(event) => setNewArrival(event.target.checked)} />
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
