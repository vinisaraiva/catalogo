import { ImageResponse } from "next/og";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { StoreIconVisual, loadBrandingStoreOrFallback } from "@/lib/branding/store-icon-visual";

/**
 * Browser tab favicon, generated from the store's logo (`stores.logo_url`)
 * instead of a static file — see `StoreIconVisual` for why. Applies to the
 * whole app (public storefront and admin alike): one store, one icon.
 * ARCHITECTURE.md §22 "PWA — icons when available".
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const revalidate = 3600; // regenerate at most once an hour — a logo change shows up within the hour, not on every request

export default async function Icon() {
  const store = await loadBrandingStoreOrFallback(getStorefrontStore);
  return new ImageResponse(<StoreIconVisual store={store} size={size.width} />, size);
}
