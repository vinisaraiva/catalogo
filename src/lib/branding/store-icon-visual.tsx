import { resolveStoreIconInitial } from "@/domain/branding";

/**
 * Neutral fallback palette for a store with no logo yet — a plain
 * initial-letter badge instead of a generated image (see
 * `src/domain/branding.ts`'s header comment).
 */
const FALLBACK_BACKGROUND = "#0f172a"; // slate-900
const FALLBACK_TEXT_COLOR = "#f8fafc"; // slate-50

/**
 * Shared JSX used by every `next/og` `ImageResponse` this app renders —
 * `icon.tsx`, `apple-icon.tsx`, `icon-512/route.tsx`, and
 * `(storefront)/opengraph-image.tsx`. All of them turn the *same* store
 * logo into a square icon: `objectFit: "contain"` on a white background,
 * not `"cover"`, because a store logo is very often a wide wordmark
 * rather than a square mark — cropping it to fill a square would cut off
 * most of the name. Padding it to fit is the safer default for an admin
 * who only ever uploads one logo image (no separate "icon mark" upload
 * field exists — see `src/domain/store-asset.ts`).
 *
 * Satori (the renderer behind `ImageResponse`) fetches a remote `<img
 * src>` itself, so passing the Supabase Storage public URL directly is
 * enough — no need to download/re-encode it ourselves first.
 */
export function StoreIconVisual({
  store,
  size,
}: {
  store: { name: string; logo_url: string | null };
  size: number;
}) {
  if (store.logo_url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og's ImageResponse renders plain <img>, not next/image */}
        <img
          src={store.logo_url}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: "contain", width: "82%", height: "82%" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: FALLBACK_BACKGROUND,
        color: FALLBACK_TEXT_COLOR,
        fontSize: Math.round(size * 0.55),
        fontWeight: 700,
        fontFamily: "sans-serif",
      }}
    >
      {resolveStoreIconInitial(store.name)}
    </div>
  );
}

/**
 * Best-effort store lookup for the icon/manifest/OG routes below: they
 * must never turn a missing/misconfigured store into a broken favicon or
 * a 500 on every page share — falling back to a generic "C" badge is
 * strictly better than an error, especially right after a fresh deploy
 * before `npm run seed` has run.
 */
export async function loadBrandingStoreOrFallback(
  loadStore: () => Promise<{ name: string; logo_url: string | null }>,
): Promise<{ name: string; logo_url: string | null }> {
  try {
    return await loadStore();
  } catch {
    return { name: "Catálogo", logo_url: null };
  }
}
