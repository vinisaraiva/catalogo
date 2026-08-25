"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/types/database";
import {
  createAiModelPose,
  setAiModelPoseActive,
  uploadAiModelPoseImage,
} from "@/lib/actions/ai-models";

type AiModelPoseRow = Database["public"]["Tables"]["ai_model_poses"]["Row"];

/**
 * TASKS.md Phase 6 "AI models": CRUD poses, upload reference pose images,
 * activate/deactivate pose. Lives on the AI model edit screen — poses
 * belong to a model (`ai_model_poses.ai_model_id` is required), same
 * "manage sub-resource" placement as `ProductSizesManager`/
 * `ProductImagesManager` on the product edit page.
 */
export function AiModelPosesManager({
  aiModelId,
  initialPoses,
}: {
  aiModelId: string;
  initialPoses: AiModelPoseRow[];
}) {
  const [poses, setPoses] = useState(initialPoses);
  const [newPoseName, setNewPoseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPoseName.trim()) return;
    setIsCreating(true);
    setError(null);

    const result = await createAiModelPose(aiModelId, { name: newPoseName.trim() });
    setIsCreating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setPoses((prev) => [
      ...prev,
      {
        id: result.data.id,
        store_id: "",
        ai_model_id: aiModelId,
        name: newPoseName.trim(),
        reference_image_url: null,
        active: true,
        usage_count: 0,
        last_used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    setNewPoseName("");
  }

  async function handleFileSelected(poseId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingId(poseId);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAiModelPoseImage(poseId, formData);
    setUploadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setPoses((prev) => prev.map((pose) => (pose.id === poseId ? result.data : pose)));
  }

  async function handleToggleActive(pose: AiModelPoseRow) {
    setError(null);
    const nextActive = !pose.active;
    setPoses((prev) => prev.map((p) => (p.id === pose.id ? { ...p, active: nextActive } : p)));
    const result = await setAiModelPoseActive(pose.id, nextActive);
    if (!result.ok) {
      setError(result.error);
      setPoses((prev) => prev.map((p) => (p.id === pose.id ? { ...p, active: pose.active } : p)));
    }
  }

  return (
    <div className="space-y-3">
      {poses.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma pose cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {poses.map((pose) => (
            <li
              key={pose.id}
              className="border-border flex items-center gap-3 rounded-md border p-2"
            >
              {pose.reference_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail; see product-images-manager.tsx for the same call.
                <img
                  src={pose.reference_image_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded text-xs">
                  Sem foto
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{pose.name}</span>
                  <Badge variant={pose.active ? "success" : "secondary"}>
                    {pose.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">Usada {pose.usage_count}x</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  ref={(el) => {
                    fileInputRefs.current[pose.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelected(pose.id, e)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Enviar foto de referência"
                  disabled={uploadingId === pose.id}
                  onClick={() => fileInputRefs.current[pose.id]?.click()}
                >
                  <ImagePlus />
                </Button>
                <Switch
                  aria-label={pose.active ? "Desativar pose" : "Ativar pose"}
                  checked={pose.active}
                  onChange={() => handleToggleActive(pose)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <Input
          placeholder="Nome da nova pose (ex.: De frente)"
          value={newPoseName}
          onChange={(e) => setNewPoseName(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={isCreating || !newPoseName.trim()}>
          <Plus /> Adicionar
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
