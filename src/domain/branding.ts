/**
 * Small deterministic helpers behind the app/PWA icon, the browser tab
 * favicon, and the WhatsApp/Open Graph share card (`src/app/icon.tsx`,
 * `apple-icon.tsx`, `icon-512/route.tsx`, `manifest.ts`,
 * `(storefront)/opengraph-image.tsx`). Kept as pure functions so the
 * fallback-when-no-logo and manifest-name logic is unit-testable — the
 * actual image rendering (`next/og` `ImageResponse`) is UI plumbing, not
 * domain logic, and isn't unit tested, matching how the rest of this
 * codebase only tests the pure logic behind a screen, not the screen
 * itself.
 *
 * CLAUDE.md "Image generation for social media" calls for deterministic
 * server-side processing instead of another AI call — a store with no
 * logo yet gets a plain initial-letter badge, not a generated image.
 */

/** First letter of the store name, uppercased. Falls back to "C" (Catálogo) for an empty/whitespace-only name — should never happen given `storeProfileInputSchema` requires a non-empty name, but keeps this pure function total. */
export function resolveStoreIconInitial(storeName: string): string {
  const trimmed = storeName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "C";
}

/**
 * `manifest.ts` `short_name` — the label shown under the icon on a phone's
 * home screen. The Web App Manifest spec recommends keeping it short
 * (~12 characters) so it doesn't get truncated by the OS; this trims to
 * that length without cutting a trailing partial word off mid-character.
 */
export function buildManifestShortName(storeName: string, maxLength = 12): string {
  const trimmed = storeName.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trimEnd();
}
