import { ImageResponse } from "next/og";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { StoreIconVisual, loadBrandingStoreOrFallback } from "@/lib/branding/store-icon-visual";

/**
 * The card WhatsApp (and any other link-preview crawler — iMessage,
 * Telegram, Twitter/X) shows when the storefront link is shared: store
 * icon + store name. Next.js auto-injects this into every storefront
 * page's `og:image`/`twitter:image` meta tags — no manual wiring needed
 * beyond this file existing in the route segment.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function OpengraphImage() {
  const store = await loadBrandingStoreOrFallback(getStorefrontStore);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        gap: 40,
      }}
    >
      <div
        style={{
          width: 220,
          height: 220,
          display: "flex",
          borderRadius: 32,
          overflow: "hidden",
        }}
      >
        <StoreIconVisual store={store} size={220} />
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 56,
          fontWeight: 700,
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        {store.name}
      </div>
    </div>,
    size,
  );
}
