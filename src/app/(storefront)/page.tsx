import Link from "next/link";
import Image from "next/image";
import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { listTeams } from "@/lib/queries/teams";
import { listCollections } from "@/lib/queries/collections";
import { listCompetitions, type CompetitionRow } from "@/lib/queries/competitions";
import { listPublicProducts } from "@/lib/queries/public-products";
import { listStoreHeroImages } from "@/lib/queries/store-hero-images";
import { TeamCard } from "@/components/storefront/team-card";
import { ProductCard } from "@/components/storefront/product-card";
import { WhatsappCta } from "@/components/storefront/whatsapp-cta";
import { cn } from "@/lib/utils";
import { Shirt } from "lucide-react";

/**
 * PRD §17 "Catálogo público" / Home. "Retrô" is treated as the collection
 * whose slug is `retro` — a naming convention (documented here since the
 * PRD doesn't define one), matching what `scripts/seed.ts` creates. Each
 * section only renders when it actually has content ("se existirem" /
 * "quando aplicável" per PRD), so an otherwise-empty catalog still shows a
 * clean Home instead of empty section headers.
 *
 * No floating "Fale conosco" WhatsApp button here anymore (DECISIONS.md
 * ADR-032) — every `ProductCard` in every grid below already has its own
 * direct WhatsApp button. Keeping the floating one too meant it visually
 * sat on top of the right-column card's own button at some scroll
 * position (both fixed-position elements, unavoidably), which could send
 * a generic "vi o catálogo" message when the customer meant to ask about
 * the specific shirt underneath. The hero's own CTA (DECISIONS.md
 * ADR-033) doesn't have that problem — it's part of the normal page
 * flow, not fixed-position, so it can't ever collide with a card.
 */

/**
 * Picks one hero photo per page load, server-side (DECISIONS.md ADR-035 —
 * supersedes ADR-034's static `public/hero/` files with admin-managed
 * `store_hero_images` rows, uploaded from Configurações). Not all of them
 * stacked in a client-side crossfade — PRD §17/CLAUDE.md both want the
 * storefront to "load fast on mobile", and downloading every hero photo on
 * each visit just to show one at a time would work against that. A
 * visitor who reloads or comes back later sees a different one.
 *
 * Pulled out of the page component on purpose: this is a Server Component
 * executed fresh per request (no client re-render to worry about), but the
 * `react-hooks/purity` lint rule still flags any direct `Math.random()`
 * call inside a component body as an impure render, React-Compiler-style.
 * A plain (non-component-named) helper sidesteps that without suppressing
 * the rule.
 */
function pickHeroImage(images: { url: string }[]): string | null {
  if (images.length === 0) return null;
  const index = Math.floor(Math.random() * images.length);
  return images[index]?.url ?? images[0]!.url;
}

export default async function StorefrontHomePage() {
  const store = await getStorefrontStore();
  const heroImages = await listStoreHeroImages(store.id);
  const heroImage = pickHeroImage(heroImages);

  const [featuredTeams, nationalTeams, collections, competitions, newArrivals, featuredProducts, promoProducts] =
    await Promise.all([
      listTeams(store.id, { featuredOnly: true }),
      listTeams(store.id, { type: "national_team" }),
      listCollections(store.id),
      listCompetitions(store.id),
      listPublicProducts(store.id, { newArrival: true, limit: 8 }),
      listPublicProducts(store.id, { featured: true, limit: 8 }),
      listPublicProducts(store.id, { hasPromotion: true, limit: 8 }),
    ]);

  const retroCollection = collections.find((c) => c.slug === "retro");
  const retroProducts = retroCollection
    ? await listPublicProducts(store.id, { collectionId: retroCollection.id, limit: 8 })
    : [];

  // "Categorias" (DECISIONS.md ADR-032, inspired by the seller's old
  // store grouping products by competition — Brasileirão, Libertadores,
  // ...). Data-driven per CLAUDE.md's classification rules, not a
  // hardcoded list: whatever competitions the seller has created in admin
  // show up here, same principle as `time/[slug]`'s own dynamic filter
  // chips. A competition with zero published products yet is skipped so
  // a tile never leads to an empty page.
  const competitionsWithProducts = (
    await Promise.all(
      competitions.map(async (competition) => {
        const sample = await listPublicProducts(store.id, { competitionId: competition.id, limit: 1 });
        return sample.length > 0 ? competition : null;
      }),
    )
  ).filter((competition): competition is CompetitionRow => competition !== null);

  return (
    <div className="space-y-10">
      <div
        className={cn(
          "relative isolate flex min-h-[440px] flex-col justify-end overflow-hidden rounded-2xl p-6 text-white shadow-lg shadow-primary/20",
          // No hero photo uploaded yet (Configurações → "Banner da página
          // inicial") — fall back to the flat brand gradient from
          // ADR-031/033 instead of an empty/broken image.
          !heroImage && "bg-gradient-to-br from-primary via-primary/90 to-accent",
        )}
      >
        {heroImage ? (
          <>
            <Image src={heroImage} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
            {/* Dark gradient so the headline/CTA stay readable over any
                photo, plus a thin wash of the brand blue/orange so the
                photo still reads as "this store" even without any text on
                it. */}
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/30 via-transparent to-accent/25 mix-blend-multiply"
              aria-hidden="true"
            />
          </>
        ) : null}

        <div className="relative space-y-4">
          <div className="border-white/20 bg-white/10 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-widest text-white/85 uppercase backdrop-blur-sm">
            <span className="bg-price-on-photo size-1.5 animate-pulse rounded-full" aria-hidden="true" />
            Catálogo oficial · {store.name}
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-[2.5rem] leading-[0.88] tracking-wide text-balance uppercase">
              Vista a camisa
              <br />
              do seu time
            </h1>
            <p className="max-w-[30ch] text-sm text-white/80">
              Camisas de times, seleções e muito mais — direto pelo WhatsApp.
            </p>
          </div>
          {store.whatsapp_number ? (
            <WhatsappCta
              phoneNumber={store.whatsapp_number}
              message={`Olá! Vi o catálogo da ${store.name} e gostaria de saber mais.`}
              size="lg"
              className="w-fit shadow-lg shadow-black/25"
            >
              Falar no WhatsApp
            </WhatsappCta>
          ) : null}
        </div>
      </div>

      {competitionsWithProducts.length > 0 ? (
        <Section title="Categorias">
          <div className="hide-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {competitionsWithProducts.map((competition, index) => (
              <Link
                key={competition.id}
                href={`/busca?competition=${competition.slug}`}
                className="group relative h-32 w-40 shrink-0 snap-start overflow-hidden rounded-xl shadow-sm"
              >
                <div
                  className={cn(
                    "absolute inset-0 transition-transform duration-500 group-hover:scale-105",
                    index % 2 === 0
                      ? "bg-gradient-to-br from-primary via-primary/85 to-accent"
                      : "bg-gradient-to-br from-accent via-accent/85 to-primary",
                  )}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-display text-lg tracking-wide text-white uppercase">
                    {competition.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {featuredTeams.length > 0 ? (
        <Section title="Times populares">
          <div className="hide-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {featuredTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </Section>
      ) : null}

      {promoProducts.length > 0 ? (
        <Section title="Promoções">
          <ProductGrid products={promoProducts} />
        </Section>
      ) : null}

      {newArrivals.length > 0 ? (
        <Section title="Novidades">
          <ProductGrid products={newArrivals} />
        </Section>
      ) : null}

      {featuredProducts.length > 0 ? (
        <Section title="Destaques">
          <ProductGrid products={featuredProducts} />
        </Section>
      ) : null}

      {nationalTeams.length > 0 ? (
        <Section title="Seleções">
          <div className="hide-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {nationalTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </Section>
      ) : null}

      {retroProducts.length > 0 ? (
        <Section title="Retrô">
          <ProductGrid products={retroProducts} />
        </Section>
      ) : null}

      {featuredTeams.length === 0 &&
      promoProducts.length === 0 &&
      newArrivals.length === 0 &&
      featuredProducts.length === 0 &&
      nationalTeams.length === 0 &&
      retroProducts.length === 0 &&
      competitionsWithProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <Shirt className="text-muted-foreground size-8" />
          </div>
          <p className="text-muted-foreground text-sm">
            Catálogo em preparação — volte em breve.
          </p>
          {/* The only case on Home with no ProductCard anywhere to carry
              its own WhatsApp button, so PRD §17's "botão WhatsApp" still
              needs a fallback here — no collision risk since nothing else
              floats on an empty page. */}
          {store.whatsapp_number ? (
            <WhatsappCta
              phoneNumber={store.whatsapp_number}
              message={`Olá! Vi o catálogo da ${store.name} e gostaria de saber mais.`}
            >
              Fale conosco
            </WhatsappCta>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl tracking-wide uppercase">{title}</h2>
        <div className="bg-primary h-1 w-10 rounded-full" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products }: { products: Awaited<ReturnType<typeof listPublicProducts>> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
