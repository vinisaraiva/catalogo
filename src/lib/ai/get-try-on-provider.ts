import "server-only";
import { getServerEnv } from "@/lib/env";
import type { TryOnProvider } from "@/domain/try-on-provider";
import { GoogleVTOProvider } from "./google-vto-provider";

export class TryOnProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TryOnProviderNotConfiguredError";
  }
}

/**
 * Resolves the configured `TryOnProvider` (ARCHITECTURE.md §13: "Business
 * services call the interface, not the provider implementation directly").
 * `TRYON_AI_PROVIDER` selects which one; only `google_vto` exists today
 * (`FashnProvider`/`FalProvider` are explicitly future-only per CLAUDE.md
 * "Do not implement future providers unless the PRD is explicitly
 * updated").
 *
 * Called lazily from the generation Server Action, never at module load —
 * CLAUDE.md "AI must be optional" means an install with no AI credentials
 * configured must keep serving the normal catalog; this only throws at the
 * moment someone actually tries to trigger a generation.
 */
export function getTryOnProvider(): TryOnProvider {
  const env = getServerEnv();
  const providerName = env.TRYON_AI_PROVIDER ?? "google_vto";

  if (providerName === "google_vto") {
    if (!env.GOOGLE_CLOUD_PROJECT || !env.GOOGLE_CLOUD_LOCATION) {
      throw new TryOnProviderNotConfiguredError(
        "Geração de imagens com IA não está configurada nesta loja (variáveis GOOGLE_CLOUD_PROJECT / GOOGLE_CLOUD_LOCATION ausentes).",
      );
    }
    return new GoogleVTOProvider({
      projectId: env.GOOGLE_CLOUD_PROJECT,
      location: env.GOOGLE_CLOUD_LOCATION,
    });
  }

  throw new TryOnProviderNotConfiguredError(`Provedor de IA desconhecido: "${providerName}".`);
}
