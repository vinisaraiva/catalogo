import type { Metadata } from "next";
import Link from "next/link";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { SearchBar } from "@/components/storefront/search-bar";
import { SelectionProvider } from "@/components/storefront/selection-provider";
import { SelectionBar } from "@/components/storefront/selection-bar";
import { cn } from "@/lib/utils";

/**
 * Storefront-only typography (see `globals.css`'s `.storefront-theme`
 * header comment for the palette rationale). Self-hosted via `@fontsource`
 * — not `next/font/google` — and imported here rather than in the root
 * layout, so (a) the admin panel's CSS bundle never even downloads these
 * font files (Next.js code-splits per-route CSS imports), and (b) the
 * build has no runtime dependency on reaching fonts.googleapis.com, which
 * isn't guaranteed reachable from every network this project gets built
 * on (`next/font/google` failed outright in this session's own build
 * sandbox — see DECISIONS.md's redesign ADR).
 *
 * Bebas Neue: condensed poster/scoreboard caps for headings, team names,
 * prices — the "back-of-jersey lettering" register (`font-display`
 * utility, mapped in `globals.css`). Plus Jakarta Sans: a legible modern
 * grotesk for body/UI text, set as `.storefront-theme`'s base
 * `font-family`. Paired on a contrast axis (condensed display vs.
 * humanist-geometric text face), not two similar-weight sans-serifs.
 */
import "@fontsource/bebas-neue/400.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";

/**
 * Store-branded title/description/Open Graph for every storefront route,
 * overriding the generic "Catálogo" default from the root layout
 * (`src/app/layout.tsx`). This is what a WhatsApp/iMessage/Telegram link
 * preview reads when a customer shares the catalog link — the preview
 * *image* comes from `opengraph-image.tsx` in this same route group,
 * which Next.js merges in automatically without needing an `images` entry
 * here.
 */
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStorefrontStore();
  const description = `Catálogo de camisas — ${store.name}`;

  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description,
    openGraph: { title: store.name, description, type: "website" },
  };
}

/**
 * Shell for every public storefront route (PRD §17 "identidade da loja").
 * No auth, no admin chrome — see ARCHITECTURE.md §4.1.
 *
 * `storefront-theme` (globals.css) scopes the dark oxblood/gold visual
 * identity to this subtree only — the admin panel never sees it.
 *
 * `SelectionProvider` wraps every storefront page so the local WhatsApp
 * selection basket (PRD §22, TASKS.md Phase 4) survives client-side
 * navigation between pages, not just within one page. `pb-28` reserves
 * room at the bottom for `SelectionBar`, which is `fixed` and only
 * renders once at least one product is selected.
 */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const store = await getStorefrontStore();

  return (
    <div className={cn("storefront-theme bg-background text-foreground min-h-svh")}>
      <SelectionProvider>
        <header className="bg-brand text-brand-foreground sticky top-0 z-10 space-y-3 px-4 pt-3 pb-4 shadow-md">
          <Link href="/" className="flex items-center gap-2.5">
            {store.logo_url ? (
              <span className="ring-brand-foreground/30 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-1 ring-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, not a known image host */}
                <img src={store.logo_url} alt="" className="h-full w-full object-contain" />
              </span>
            ) : null}
            <span className="font-display truncate text-2xl tracking-wide uppercase">
              {store.name}
            </span>
          </Link>
          <SearchBar />
        </header>
        <main className="p-4 pb-28">{children}</main>
        <SelectionBar whatsappNumber={store.whatsapp_number} />
      </SelectionProvider>
    </div>
  );
}
