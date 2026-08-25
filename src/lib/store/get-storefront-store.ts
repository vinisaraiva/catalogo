import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { getActiveStoreBySlug, type StoreRow } from "@/lib/queries/store";

/**
 * The MVP is single-store (CLAUDE.md "Multi-store-ready architecture" —
 * ready for multiple stores in the data model, but the public storefront
 * itself has no store-selection UI/routing yet). Every storefront page
 * resolves "the" store through DEFAULT_STORE_SLUG instead of taking a
 * store param, so real multi-store routing later is a routing change, not
 * a data-model change.
 *
 * Wrapped in React's `cache()` so the layout and the page it wraps (both
 * of which need the store) share one DB round-trip per request instead of
 * two.
 */
export const getStorefrontStore = cache(async (): Promise<StoreRow> => {
  const { DEFAULT_STORE_SLUG } = getServerEnv();

  if (!DEFAULT_STORE_SLUG) {
    throw new Error(
      "DEFAULT_STORE_SLUG is not set — the public storefront needs it to know which store to show. See .env.example.",
    );
  }

  const store = await getActiveStoreBySlug(DEFAULT_STORE_SLUG);
  if (!store) notFound();
  return store;
});
