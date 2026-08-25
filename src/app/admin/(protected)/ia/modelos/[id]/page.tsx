import { notFound } from "next/navigation";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getAiModel, listAiModelPoses } from "@/lib/queries/ai-models";
import { AiModelForm } from "@/components/admin/ai-model-form";
import { AiModelPosesManager } from "@/components/admin/ai-model-poses-manager";
import { createAiModel, updateAiModel } from "@/lib/actions/ai-models";
import { Separator } from "@/components/ui/separator";

export default async function EditAiModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireStoreMembership();

  const [model, poses] = await Promise.all([
    getAiModel(store.id, id),
    listAiModelPoses(store.id, id),
  ]);
  if (!model) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Editar modelo de IA</h1>

      <AiModelForm
        redirectPath="/admin/ia/modelos"
        createAction={createAiModel}
        updateAction={updateAiModel}
        initialData={{
          id: model.id,
          name: model.name,
          active: model.active,
          sort_order: model.sort_order,
        }}
      />

      <Separator />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Poses</h2>
        <p className="text-muted-foreground text-xs">
          Aproximadamente 4 poses aprovadas por modelo (PRD §10). Cada pose precisa de uma foto de
          referência antes de poder ser usada em uma geração.
        </p>
        <AiModelPosesManager aiModelId={model.id} initialPoses={poses} />
      </div>
    </div>
  );
}
