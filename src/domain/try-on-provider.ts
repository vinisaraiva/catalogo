/**
 * Provider-agnostic virtual try-on contract (PRD.md §9 / ARCHITECTURE.md
 * §13 "AI provider abstraction — Try-on"). Business code (the generation
 * Server Action) depends only on this interface, never on
 * `GoogleVTOProvider` directly — CLAUDE.md "AI architecture": "Never
 * couple business logic directly to one provider."
 *
 * Deliberately pure types/interfaces with no I/O in this file — the actual
 * network call lives in `src/lib/ai/google-vto-provider.ts`, which is the
 * only place that talks to Google Cloud.
 */

/**
 * Both images are passed as URLs (not raw bytes) because both the pose
 * reference photo and the product's original photo already live in
 * Supabase Storage as public URLs by the time a generation is triggered —
 * the provider implementation is responsible for fetching and encoding
 * whatever bytes format its API needs.
 */
export interface TryOnInput {
  /** Public URL of the chosen AI model pose's reference photo. */
  personImageUrl: string;
  /** Public URL of the product's original (admin-uploaded) photo. */
  productImageUrl: string;
  /**
   * How many candidate images to request from the provider. The MVP
   * approval flow (ARCHITECTURE.md §12) reviews one candidate at a time,
   * so callers should normally omit this and let it default to 1; kept
   * configurable so a provider that only returns a batch isn't fighting
   * the interface.
   */
  sampleCount?: number;
}

export interface TryOnResultImage {
  /** Raw image bytes, base64-encoded — never persisted as-is; the caller
   * uploads it to Supabase Storage and only stores the resulting URL. */
  base64: string;
  mimeType: string;
}

export interface TryOnResult {
  images: TryOnResultImage[];
  /** USD (or provider-billing-currency) cost estimate for this call, when
   * the provider exposes one. `ai_generations.cost_estimate` is nullable
   * specifically to accommodate providers that don't (PRD.md §11). */
  costEstimate?: number | null;
}

/**
 * Thrown by any `TryOnProvider.generate()` implementation on failure —
 * network error, auth error, provider-side rejection, unexpected response
 * shape, etc. A single error type lets the generation action record
 * `error_message` uniformly regardless of which provider is configured
 * (CLAUDE.md "AI failures should be recorded distinctly from successful
 * generations").
 */
export class TryOnProviderError extends Error {
  constructor(
    message: string,
    readonly options: { cause?: unknown; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = "TryOnProviderError";
  }
}

/**
 * ARCHITECTURE.md §13:
 * ```ts
 * interface TryOnProvider {
 *   generate(input: TryOnInput): Promise<TryOnResult>
 * }
 * ```
 * `name`/`model` are added beyond that minimal sketch because
 * `ai_generations.provider` / `ai_generations.model` (PRD.md §11) need a
 * value to persist, and reading it off the provider instance itself (Fashn,
 * Fal, ... future providers each hardcode their own) keeps that detail out
 * of the business layer.
 */
export interface TryOnProvider {
  readonly name: string;
  readonly model: string;
  generate(input: TryOnInput): Promise<TryOnResult>;
}
