"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Database } from "@/types/database";
import {
  approveAiGeneration,
  discardAiGeneration,
  triggerTryOnGeneration,
} from "@/lib/actions/ai-generations";

type AiGenerationRow = Database["public"]["Tables"]["ai_generations"]["Row"];
type AiModelRow = Database["public"]["Tables"]["ai_models"]["Row"];
type AiModelPoseRow = Database["public"]["Tables"]["ai_model_poses"]["Row"];

const STATUS_LABEL: Record<AiGenerationRow["status"], string> = {
  pending: "Pendente",
  processing: "Gerando...",
  succeeded: "Aguardando revisão",
  failed: "Falhou",
  approved: "Aprovada",
  discarded: "Descartada",
};

const STATUS_VARIANT: Record<
  AiGenerationRow["status"],
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  pending: "secondary",
  processing: "warning",
  succeeded: "warning",
  failed: "destructive",
  approved: "success",
  discarded: "secondary",
};

/**
 * TASKS.md Phase 6 "AI generations" + "Approval". Lives on the product
 * edit page — the whole flow (ARCHITECTURE.md §12) is scoped to one
 * product's original photo at a time. Manual/automatic selection
 * (TASKS.md "Selection logic") and the daily quota display (PRD §11) are
 * both surfaced here rather than as separate screens, since this is the
 * only place an admin actually triggers a generation.
 */
export function AiTryOnPanel({
  productId,
  hasOriginalPhoto,
  initialGenerations,
  activeModels,
  activePoses,
  usageLimit,
  usageToday,
}: {
  productId: string;
  hasOriginalPhoto: boolean;
  initialGenerations: AiGenerationRow[];
  activeModels: AiModelRow[];
  activePoses: AiModelPoseRow[];
  usageLimit: number;
  usageToday: number;
}) {
  const [generations, setGenerations] = useState(initialGenerations);
  const [mode, setMode] = useState<"automatic" | "manual">("automatic");
  const [selectedModelId, setSelectedModelId] = useState(activeModels[0]?.id ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(usageToday);

  const posesForSelectedModel = useMemo(
    () =>
      activePoses.filter(
        (pose) => pose.ai_model_id === selectedModelId && pose.reference_image_url,
      ),
    [activePoses, selectedModelId],
  );
  const [selectedPoseId, setSelectedPoseId] = useState(posesForSelectedModel[0]?.id ?? "");

  const quotaExhausted = used >= usageLimit;
  const canUseManualMode = activeModels.some((model) =>
    activePoses.some((pose) => pose.ai_model_id === model.id && pose.reference_image_url),
  );

  function handleModelChange(modelId: string) {
    setSelectedModelId(modelId);
    const firstPose = activePoses.find(
      (pose) => pose.ai_model_id === modelId && pose.reference_image_url,
    );
    setSelectedPoseId(firstPose?.id ?? "");
  }

  async function handleGenerate() {
    setError(null);
    if (mode === "manual" && (!selectedModelId || !selectedPoseId)) {
      setError("Selecione um modelo e uma pose.");
      return;
    }

    setIsGenerating(true);
    const result = await triggerTryOnGeneration(
      mode === "manual"
        ? { productId, mode, aiModelId: selectedModelId, aiModelPoseId: selectedPoseId }
        : { productId, mode },
    );
    setIsGenerating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setGenerations((prev) => [result.data, ...prev]);
    if (result.data.status === "succeeded" || result.data.status === "failed") {
      setUsed((prev) => prev + 1);
    }
  }

  async function handleApprove(generationId: string) {
    setPendingId(generationId);
    setError(null);
    const result = await approveAiGeneration(generationId);
    setPendingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setGenerations((prev) =>
      prev.map((g) => (g.id === generationId ? { ...g, status: "approved" } : g)),
    );
  }

  async function handleDiscard(generationId: string) {
    setPendingId(generationId);
    setError(null);
    const result = await discardAiGeneration(generationId);
    setPendingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setGenerations((prev) =>
      prev.map((g) => (g.id === generationId ? { ...g, status: "discarded" } : g)),
    );
  }

  if (!hasOriginalPhoto) {
    return (
      <p className="text-muted-foreground text-sm">
        Envie ao menos uma foto do produto para poder gerar arte com IA.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {used} de {usageLimit} gerações de IA utilizadas hoje.
      </p>

      {quotaExhausted ? (
        <p role="alert" className="text-destructive text-sm">
          Limite diário de IA atingido. Você ainda pode cadastrar e publicar produtos usando suas
          fotos normalmente.
        </p>
      ) : activeModels.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Cadastre ao menos um modelo de IA ativo com uma pose com foto de referência em{" "}
          <strong>Modelos IA</strong> para poder gerar arte.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "automatic" ? "default" : "outline"}
              onClick={() => setMode("automatic")}
            >
              Automático
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "manual" ? "default" : "outline"}
              disabled={!canUseManualMode}
              onClick={() => setMode("manual")}
            >
              Manual
            </Button>
          </div>

          {mode === "manual" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="ai-model-select">Modelo</Label>
                <Select
                  id="ai-model-select"
                  value={selectedModelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                >
                  {activeModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ai-pose-select">Pose</Label>
                <Select
                  id="ai-pose-select"
                  value={selectedPoseId}
                  onChange={(e) => setSelectedPoseId(e.target.value)}
                >
                  {posesForSelectedModel.map((pose) => (
                    <option key={pose.id} value={pose.id}>
                      {pose.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          <Button type="button" disabled={isGenerating} onClick={handleGenerate}>
            <Sparkles /> {isGenerating ? "Gerando..." : "Gerar arte com IA"}
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {generations.length > 0 ? (
        <ul className="space-y-2">
          {generations.map((generation) => (
            <li
              key={generation.id}
              className="border-border flex items-center gap-3 rounded-md border p-2"
            >
              {generation.result_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail; see product-images-manager.tsx for the same call.
                <img
                  src={generation.result_image_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="bg-muted h-14 w-14 shrink-0 rounded" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <Badge variant={STATUS_VARIANT[generation.status]}>
                  {STATUS_LABEL[generation.status]}
                </Badge>
                {generation.error_message ? (
                  <p className="text-destructive truncate text-xs">{generation.error_message}</p>
                ) : null}
              </div>
              {generation.status === "succeeded" ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pendingId === generation.id}
                    onClick={() => handleApprove(generation.id)}
                  >
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingId === generation.id}
                    onClick={() => handleDiscard(generation.id)}
                  >
                    Descartar
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
