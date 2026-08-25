import { ImageResponse } from "next/og";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { StoreIconVisual, loadBrandingStoreOrFallback } from "@/lib/branding/store-icon-visual";

/**
 * iOS "Add to Home Screen" icon — Apple's own convention is 180x180. Same
 * source/rendering as `icon.tsx`, just a different output size.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function AppleIcon() {
  const store = await loadBrandingStoreOrFallback(getStorefrontStore);
  return new ImageResponse(<StoreIconVisual store={store} size={size.width} />, size);
}
