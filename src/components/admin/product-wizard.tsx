"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { slugify } from "@/domain/slug";
import type { PriceDisplayMode } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createProduct } from "@/lib/actions/products";
import { createTeam } from "@/lib/actions/teams";

export interface WizardOption {
  id: string;
  name: string;
}

const STEPS = ["Time", "Classificação", "Comercial"] as const;

/**
 * Product creation wizard — PRD §15 "Cadastro de produto" steps 1
 * (Time), 2 (Classificação) and 4 (Comercial), in that order. Step 3
 * ("Imagem: Tirar foto / Galeria") is intentionally skipped here: image
 * upload is Phase 5 scope (TASKS.md), not Phase 2. Sizes/stock — also
 * listed under Etapa 4 in the PRD — are likewise deferred to the edit
 * screen: `product_sizes` rows have a `product_id` foreign key, so a size
 * cannot be attached before the product itself exists. Etapa 5
 * ("Publicação": rascunho/publicar/gerar arte IA) lives on the edit page
 * for the same reason, minus "Gerar arte com IA" which is Phase 6/7.
 *
 * "+ Novo time sem sair do fluxo" (PRD §15 Etapa 1) is implemented as an
 * inline mini create-team form scoped to name only; the remaining team
 * fields (país, escudo, ordem, destaque) can be filled in later from
 * Times, same as any other team.
 */
export function ProductWizard({
  teams: initialTeams,
  collections,
  competitions,
}: {
  teams: WizardOption[];
  collections: WizardOption[];
  competitions: WizardOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [teams, setTeams] = useState(initialTeams);
  const [teamId, setTeamId] = useState(initialTeams[0]?.id ?? "");
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const [collectionId, setCollectionId] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [season, setSeason] = useState("");
  const [model, setModel] = useState("");
  const [productType, setProductType] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState("");
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [priceDisplayMode, setPriceDisplayMode] = useState<PriceDisplayMode>("show_price");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleCreateTeam() {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    setIsCreatingTeam(true);
    setTeamError(null);

    const result = await createTeam({
      name: trimmed,
      slug: slugify(trimmed),
      type: "club",
      country: null,
      logo_url: null,
      featured: false,
      active: true,
      sort_order: 0,
    });

    setIsCreatingTeam(false);

    if (!result.ok) {
      setTeamError(result.error);
      return;
    }

    const created = { id: result.data.id, name: trimmed };
    setTeams((prev) => [...prev, created]);
    setTeamId(created.id);
    setNewTeamName("");
    setShowNewTeam(false);
  }

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
      price: price === "" ? null : Number(price),
      promotional_price: promotionalPrice === "" ? null : Number(promotionalPrice),
      price_display_mode: priceDisplayMode,
      status: "draft",
    };

    const result = await createProduct(input);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(`/admin/produtos/${result.data.id}`);
    router.refresh();
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-4">
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex-1 rounded-full px-2 py-1 text-center font-medium",
              index === step
                ? "bg-primary text-primary-foreground"
                : index < step
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <form onSubmit={isLastStep ? handleSubmit : (event) => event.preventDefault()} className="space-y-4">
        {step === 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="team_id">Time</Label>
              {teams.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum time cadastrado ainda. Crie um abaixo para continuar.
                </p>
              ) : (
                <Select id="team_id" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {showNewTeam ? (
              <div className="border-border space-y-2 rounded-md border p-3">
                <Label htmlFor="new_team_name">Nome do novo time</Label>
                <Input
                  id="new_team_name"
                  value={newTeamName}
                  onChange={(event) => setNewTeamName(event.target.value)}
                  placeholder="Ex.: Vitória"
                />
                {teamError ? (
                  <p role="alert" className="text-destructive text-sm">
                    {teamError}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isCreatingTeam || !newTeamName.trim()}
                    onClick={handleCreateTeam}
                  >
                    {isCreatingTeam ? "Criando..." : "Criar time"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewTeam(false)}>
                    Cancelar
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  País, escudo, ordem e destaque podem ser ajustados depois em Times.
                </p>
              </div>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={() => setShowNewTeam(true)}>
                <Plus /> Novo time
              </Button>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="collection_id">Coleção (opcional)</Label>
              <Select
                id="collection_id"
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
              >
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
              <Select
                id="competition_id"
                value={competitionId}
                onChange={(event) => setCompetitionId(event.target.value)}
              >
                <option value="">Nenhuma</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Temporada (opcional)</Label>
              <Input id="season" value={season} onChange={(event) => setSeason(event.target.value)} placeholder="Ex.: 2026" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo (opcional)</Label>
              <Input id="model" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Ex.: Home" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_type">Tipo (opcional)</Label>
              <Input
                id="product_type"
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                placeholder="Ex.: Camisa jogador"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" required value={name} onChange={(event) => handleNameChange(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                required
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (opcional)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotional_price">Preço promocional (opcional)</Label>
              <Input
                id="promotional_price"
                type="number"
                min={0}
                step="0.01"
                value={promotionalPrice}
                onChange={(event) => setPromotionalPrice(event.target.value)}
              />
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
            <p className="text-muted-foreground text-xs">
              Tamanhos e estoque são configurados depois de salvar, na tela de edição do produto.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
              Voltar
            </Button>
          ) : null}
          {!isLastStep ? (
            <Button
              type="button"
              className="flex-1"
              disabled={step === 0 && !teamId}
              onClick={() => setStep((current) => current + 1)}
            >
              Continuar
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isSubmitting || !teamId}>
              {isSubmitting ? "Salvando..." : "Salvar rascunho"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
