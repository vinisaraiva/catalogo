import type { MetadataRoute } from "next";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { loadBrandingStoreOrFallback } from "@/lib/branding/store-icon-visual";
import { buildManifestShortName } from "@/domain/branding";

/**
 * Web App Manifest — ARCHITECTURE.md §22 "PWA: manifest, installable
 * metadata, icons when available". Lets a seller add the admin (or a
 * customer add the storefront) to their phone's home screen with the
 * store's own name/icon instead of "Catálogo".
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const store = await loadBrandingStoreOrFallback(getStorefrontStore);

  return {
    name: store.name,
    short_name: buildManifestShortName(store.name),
    description: `Catálogo de camisas — ${store.name}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
