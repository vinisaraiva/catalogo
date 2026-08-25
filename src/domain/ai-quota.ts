/**
 * Daily AI generation quota math (PRD.md §11 "Limite de IA" /
 * ARCHITECTURE.md §14 "AI quota architecture" / CLAUDE.md "AI image
 * generation rules"). Pure — the caller counts today's "eligible"
 * generations from `ai_generations` and reads the store's
 * `daily_ai_generation_limit`; this module only does the comparison, so
 * the rule is unit-testable without a database.
 *
 * "Eligible" (ARCHITECTURE.md §14: "count eligible successful/charged
 * generations") is interpreted here as any generation that actually
 * reached the provider — status `succeeded`, `failed`, `approved` or
 * `discarded` — since those are the ones that consumed a real provider
 * call (and, for a paid provider, incurred cost) regardless of outcome.
 * `pending`/`processing` rows are mid-flight and not yet counted; in this
 * codebase's synchronous request model (no background worker — see
 * CLAUDE.md "MVP restrictions") a row only stays in `pending`/`processing`
 * for the duration of the single Server Action call that created it, so
 * this doesn't allow a slow request to dodge the count either — by the
 * time the count is read again, that row has already resolved to one of
 * the four eligible states. Documented assumption (CLAUDE.md "choose the
 * simplest solution compatible with the PRD, document important
 * assumptions") — see DECISIONS.md.
 */

export const ELIGIBLE_AI_GENERATION_STATUSES = [
  "succeeded",
  "failed",
  "approved",
  "discarded",
] as const;

export function isQuotaAvailable(dailyLimit: number, usedToday: number): boolean {
  return usedToday < dailyLimit;
}

export function remainingQuota(dailyLimit: number, usedToday: number): number {
  return Math.max(0, dailyLimit - usedToday);
}
