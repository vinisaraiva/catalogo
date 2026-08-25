import { z } from "zod";

/** PRD.md §10 `ai_models` fields: id, store_id, name, active, sort_order. */
export const aiModelInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});
export type AiModelInput = z.infer<typeof aiModelInputSchema>;

/**
 * PRD.md §10 `ai_model_poses` fields: id, store_id, ai_model_id, name,
 * reference_image_url, active, usage_count, last_used_at.
 * `reference_image_url`/`usage_count`/`last_used_at` are server-managed
 * (uploaded separately / tracked by the generation flow), not part of the
 * admin-entered form input.
 */
export const aiModelPoseInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  active: z.boolean().optional(),
});
export type AiModelPoseInput = z.infer<typeof aiModelPoseInputSchema>;

/**
 * TASKS.md Phase 6 "Selection logic": manual mode requires both ids;
 * automatic mode ignores them (selection happens server-side).
 */
export const triggerTryOnGenerationInputSchema = z
  .object({
    productId: z.string().uuid(),
    mode: z.enum(["manual", "automatic"]),
    aiModelId: z.string().uuid().optional(),
    aiModelPoseId: z.string().uuid().optional(),
  })
  .refine((input) => input.mode !== "manual" || Boolean(input.aiModelId && input.aiModelPoseId), {
    message: "Selecione um modelo e uma pose para o modo manual.",
    path: ["aiModelPoseId"],
  });
export type TriggerTryOnGenerationInput = z.infer<typeof triggerTryOnGenerationInputSchema>;

export const dailyAiGenerationLimitInputSchema = z.object({
  daily_ai_generation_limit: z.coerce.number().int().min(0).max(1000),
});
export type DailyAiGenerationLimitInput = z.infer<typeof dailyAiGenerationLimitInputSchema>;
