import "server-only";
import { GoogleAuth } from "google-auth-library";
import type { TryOnInput, TryOnProvider, TryOnResult } from "@/domain/try-on-provider";
import { TryOnProviderError } from "@/domain/try-on-provider";

/**
 * Initial `TryOnProvider` implementation (PRD.md §9 / ARCHITECTURE.md §13),
 * calling Vertex AI's Virtual Try-On predict endpoint for the
 * `virtual-try-on-001` model. Request/response shape confirmed against
 * Google Cloud's own documentation:
 * https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-virtual-try-on-images
 *
 * Auth uses a service account key file (`GOOGLE_APPLICATION_CREDENTIALS`,
 * standard Google Cloud convention) via `google-auth-library`, requesting
 * the `cloud-platform` scope — the same mechanism Google's own client
 * libraries use, kept minimal here since this is the only Vertex AI call
 * this app makes.
 *
 * Never instantiate this at module scope / import time — CLAUDE.md "AI
 * must be optional" means a deployment with no Google Cloud credentials
 * configured must still serve the normal catalog. Use
 * `getTryOnProvider()` (`./get-try-on-provider.ts`), which only constructs
 * this when a generation is actually triggered.
 */
const MODEL_NAME = "virtual-try-on-001";
const PROVIDER_NAME = "google_vto";

export interface GoogleVtoConfig {
  projectId: string;
  location: string;
}

export class GoogleVTOProvider implements TryOnProvider {
  readonly name = PROVIDER_NAME;
  readonly model = MODEL_NAME;

  private readonly config: GoogleVtoConfig;
  private readonly auth: GoogleAuth;

  constructor(config: GoogleVtoConfig) {
    this.config = config;
    this.auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  }

  async generate(input: TryOnInput): Promise<TryOnResult> {
    const [personImage, productImage] = await Promise.all([
      fetchAsBase64(input.personImageUrl),
      fetchAsBase64(input.productImageUrl),
    ]);

    const endpoint =
      `https://${this.config.location}-aiplatform.googleapis.com/v1/` +
      `projects/${this.config.projectId}/locations/${this.config.location}/` +
      `publishers/google/models/${this.model}:predict`;

    const requestBody = {
      instances: [
        {
          personImage: { image: { bytesBase64Encoded: personImage } },
          productImages: [{ image: { bytesBase64Encoded: productImage } }],
        },
      ],
      parameters: {
        sampleCount: input.sampleCount ?? 1,
      },
    };

    let accessToken: string;
    try {
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();
      if (!tokenResponse.token) {
        throw new Error("Google Cloud auth client returned no access token.");
      }
      accessToken = tokenResponse.token;
    } catch (cause) {
      throw new TryOnProviderError("Falha ao autenticar com o Google Cloud.", { cause });
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (cause) {
      throw new TryOnProviderError("Falha de rede ao chamar o provedor de IA.", {
        cause,
        retryable: true,
      });
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new TryOnProviderError(
        `Provedor de IA retornou erro ${response.status}: ${bodyText.slice(0, 500)}`,
        { retryable: response.status >= 500 },
      );
    }

    const payload = (await response.json().catch((cause: unknown) => {
      throw new TryOnProviderError("Resposta inválida do provedor de IA.", { cause });
    })) as { predictions?: { bytesBase64Encoded?: string; mimeType?: string }[] };

    const predictions = payload.predictions ?? [];
    if (predictions.length === 0) {
      throw new TryOnProviderError("Provedor de IA não retornou nenhuma imagem.");
    }

    const images = predictions
      .filter((prediction): prediction is { bytesBase64Encoded: string; mimeType: string } =>
        Boolean(prediction.bytesBase64Encoded),
      )
      .map((prediction) => ({
        base64: prediction.bytesBase64Encoded,
        mimeType: prediction.mimeType || "image/png",
      }));

    if (images.length === 0) {
      throw new TryOnProviderError("Provedor de IA retornou predições sem imagem.");
    }

    return { images, costEstimate: null };
  }
}

async function fetchAsBase64(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new TryOnProviderError(`Falha ao baixar imagem de origem: ${url}`, { cause });
  }
  if (!response.ok) {
    throw new TryOnProviderError(
      `Falha ao baixar imagem de origem (HTTP ${response.status}): ${url}`,
    );
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
