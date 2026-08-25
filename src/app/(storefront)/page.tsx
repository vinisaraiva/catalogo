import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { listTeams } from "@/lib/queries/teams";
import { listCollections } from "@/lib/queries/collections";
import { listPublicProducts } from "@/lib/queries/public-products";
import { TeamCard } from "@/components/storefront/team-card";
import { ProductCard } from "@/components/storefront/product-card";
import { WhatsappCta } from "@/components/storefront/whatsapp-cta";
import { ArrowRight } from "lucide-react";

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

  const hasContent =
    featuredTeams.length > 0 ||
    promoProducts.length > 0 ||
    newArrivals.length > 0 ||
    featuredProducts.length > 0 ||
    nationalTeams.length > 0 ||
    retroProducts.length > 0;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-muted/50 p-5 text-center animate-fade-in">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Surpreenda-se! Faça seu pedido através do nosso catálogo virtual.
        </p>
      </div>

      {featuredTeams.length > 0 ? (
        <Section title="Times populares">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
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
        <Section title="Produtos em destaque">
          <ProductGrid products={featuredProducts} />
        </Section>
      ) : null}

      {nationalTeams.length > 0 ? (
        <Section title="Seleções">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
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

      {!hasContent ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Catálogo em preparação — volte em breve.
          </p>
        </div>
      ) : null}

      <WhatsappCta
        phoneNumber={store.whatsapp_number ?? ""}
        message={`Olá! Vi o catálogo da ${store.name} e gostaria de saber mais.`}
        className="fixed right-4 bottom-20 z-10 rounded-full shadow-lg"
      >
        Fale conosco
      </WhatsappCta>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h2>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
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
