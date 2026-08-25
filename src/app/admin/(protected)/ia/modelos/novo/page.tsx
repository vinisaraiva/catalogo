import { AiModelForm } from "@/components/admin/ai-model-form";
import { createAiModel, updateAiModel } from "@/lib/actions/ai-models";

export default function NewAiModelPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Novo modelo de IA</h1>
      <AiModelForm
        redirectPath="/admin/ia/modelos"
        createAction={createAiModel}
        updateAction={updateAiModel}
      />
    </div>
  );
}
