import type { Metadata } from "next";
import Link from "next/link";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { SearchBar } from "@/components/storefront/search-bar";
import { SelectionProvider } from "@/components/storefront/selection-provider";
import { SelectionBar } from "@/components/storefront/selection-bar";

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
 * `SelectionProvider` wraps every storefront page so the local WhatsApp
 * selection basket (PRD §22, TASKS.md Phase 4) survives client-side
 * navigation between pages, not just within one page. `pb-24` reserves
 * room at the bottom for `SelectionBar`, which is `fixed` and only
 * renders once at least one product is selected.
 */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const store = await getStorefrontStore();

  return (
    <SelectionProvider>
      <div className="min-h-svh">
        <header className="border-border bg-background sticky top-0 z-10 space-y-3 border-b px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, not a known image host
              <img src={store.logo_url} alt="" className="h-8 w-8 object-contain" />
            ) : null}
            <span className="font-semibold">{store.name}</span>
          </Link>
          <SearchBar />
        </header>
        <main className="p-4 pb-24">{children}</main>
        <SelectionBar whatsappNumber={store.whatsapp_number} />
      </div>
    </SelectionProvider>
  );
}
