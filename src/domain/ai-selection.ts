/**
 * Automatic AI model/pose selection (PRD.md §10 / CLAUDE.md "AI model /
 * pose rules" / TASKS.md Phase 6 "Selection logic"). Pure, side-effect-free
 * — the caller (`src/lib/actions/ai-generations.ts`) is responsible for
 * loading the current models/poses from the database and for persisting
 * `usage_count`/`last_used_at` after a successful generation.
 *
 * CLAUDE.md is explicit that this must stay simple: "Do not build a
 * complex recommendation engine for the MVP." The two rules below are
 * exactly the two PRD.md §10 lists — nothing more:
 *   - avoid repeating the same model consecutively;
 *   - avoid excessive reuse of the same pose, preferring the
 *     least-recently/least-often used one.
 */

export interface SelectableAiModel {
  id: string;
  active: boolean;
}

export interface SelectableAiModelPose {
  id: string;
  aiModelId: string;
  active: boolean;
  usageCount: number;
  lastUsedAt: string | null;
}

/**
 * `ai_models` has no `last_used_at` of its own (PRD.md §10 only lists that
 * field on `ai_model_poses`). "Last used model" is derived instead: the
 * model that owns whichever pose was most recently used store-wide. A
 * model with no poses ever used contributes nothing and is treated as
 * never having been used.
 */
export function deriveLastUsedModelId(poses: readonly SelectableAiModelPose[]): string | null {
  let latest: SelectableAiModelPose | null = null;
  for (const pose of poses) {
    if (!pose.lastUsedAt) continue;
    if (!latest || !latest.lastUsedAt || pose.lastUsedAt > latest.lastUsedAt) {
      latest = pose;
    }
  }
  return latest?.aiModelId ?? null;
}

/**
 * Picks a model for automatic mode. Filters to active models, then avoids
 * `lastUsedModelId` when at least one other active model exists (a single
 * active model necessarily repeats — that's fine, it's the only option,
 * not "excessive" repetition). Ties broken by the order `models` is given
 * in, so callers should pass models pre-sorted by `sort_order` if that
 * ordering should act as the tiebreak.
 *
 * Returns `null` when there is no active model at all — the caller must
 * treat that as "automatic selection unavailable", not silently proceed.
 */
export function selectModelAutomatically(
  models: readonly SelectableAiModel[],
  lastUsedModelId: string | null,
): string | null {
  const active = models.filter((model) => model.active);
  if (active.length === 0) return null;

  const candidates =
    active.length > 1 && lastUsedModelId
      ? active.filter((model) => model.id !== lastUsedModelId)
      : active;

  return (candidates[0] ?? active[0])?.id ?? null;
}

/**
 * Picks a pose belonging to `aiModelId` for automatic mode: least
 * `usageCount` first, then least-recently-used (never-used poses, i.e.
 * `lastUsedAt === null`, sort before any used pose), then the given order
 * as a final tiebreak.
 *
 * Returns `null` when the model has no active pose.
 */
export function selectPoseAutomatically(
  poses: readonly SelectableAiModelPose[],
  aiModelId: string,
): string | null {
  const candidates = poses.filter((pose) => pose.aiModelId === aiModelId && pose.active);
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount;
    if (a.lastUsedAt === b.lastUsedAt) return 0;
    if (a.lastUsedAt === null) return -1;
    if (b.lastUsedAt === null) return 1;
    return a.lastUsedAt < b.lastUsedAt ? -1 : 1;
  });

  return sorted[0]?.id ?? null;
}
