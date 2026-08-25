import { ImageResponse } from "next/og";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { StoreIconVisual, loadBrandingStoreOrFallback } from "@/lib/branding/store-icon-visual";

/**
 * 512x512 icon referenced only from `manifest.ts` — Chrome's PWA install
 * criteria wants a >=512px icon, which is larger than the browser ever
 * needs for `icon.tsx`'s 32x32 favicon. A plain Route Handler (rather than
 * Next's `icon`/`apple-icon` file convention) because those two names are
 * already used above for their own fixed sizes and Next only recognizes
 * one `icon.tsx` per route segment.
 */
export const revalidate = 3600;

export async function GET() {
  const store = await loadBrandingStoreOrFallback(getStorefrontStore);
  return new ImageResponse(<StoreIconVisual store={store} size={512} />, {
    width: 512,
    height: 512,
  });
}
