import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { listTeams } from "@/lib/queries/teams";
import { listCollections } from "@/lib/queries/collections";
import { listPublicProducts } from "@/lib/queries/public-products";
import { TeamCard } from "@/components/storefront/team-card";
import { ProductCard } from "@/components/storefront/product-card";
import { WhatsappCta } from "@/components/storefront/whatsapp-cta";

/**
 * PRD §17 "Catálogo público" / Home. "Retrô" is treated as the collection
 * whose slug is `retro` — a naming convention (documented here since the
 * PRD doesn't define one), matching what `scripts/seed.ts` creates. Each
 * section only renders when it actually has content ("se existirem" /
 * "quando aplicável" per PRD), so an otherwise-empty catalog still shows a
 * clean Home instead of empty section headers.
 */
export default async function StorefrontHomePage() {
  const store = await getStorefrontStore();

  const [featuredTeams, nationalTeams, collections, newArrivals, featuredProducts, promoProducts] =
    await Promise.all([
      listTeams(store.id, { featuredOnly: true }),
      listTeams(store.id, { type: "national_team" }),
      listCollections(store.id),
      listPublicProducts(store.id, { newArrival: true, limit: 8 }),
      listPublicProducts(store.id, { featured: true, limit: 8 }),
      listPublicProducts(store.id, { hasPromotion: true, limit: 8 }),
    ]);

  const retroCollection = collections.find((c) => c.slug === "retro");
  const retroProducts = retroCollection
    ? await listPublicProducts(store.id, { collectionId: retroCollection.id, limit: 8 })
    : [];

  return (
    <div className="space-y-8">
      {featuredTeams.length > 0 ? (
        <Section title="Times populares">
          <div className="flex gap-3 overflow-x-auto">
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
          <div className="flex gap-3 overflow-x-auto">
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
      retroProducts.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          Catálogo em preparação — volte em breve.
        </p>
      ) : null}

      {store.whatsapp_number ? (
        // bottom-20, not bottom-4: leaves room for the fixed SelectionBar
        // (Phase 4, z-20) so the two never overlap when a selection is
        // active — see DECISIONS.md ADR-026.
        <WhatsappCta
          phoneNumber={store.whatsapp_number}
          message={`Olá! Vi o catálogo da ${store.name} e gostaria de saber mais.`}
          className="fixed right-4 bottom-20 z-10 shadow-lg"
        >
          Fale conosco
        </WhatsappCta>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
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
