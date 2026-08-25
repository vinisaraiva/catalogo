import { getStorefrontStore } from "@/lib/store/get-storefront-store";
import { listTeams } from "@/lib/queries/teams";
import { listCollections } from "@/lib/queries/collections";
import { listPublicProducts } from "@/lib/queries/public-products";
import { TeamCard } from "@/components/storefront/team-card";
import { ProductCard } from "@/components/storefront/product-card";
import { WhatsappCta } from "@/components/storefront/whatsapp-cta";
import { Shirt } from "lucide-react";

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
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-accent/80 p-6 text-white animate-fade-in">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/60">
            <Shirt className="size-4" aria-hidden="true" />
            <span>{store.name}</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            Confira nosso<br />catálogo esportivo
          </h1>
          <p className="text-sm text-white/70">
            Camisas de times, seleções e muito mais.
          </p>
        </div>
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
      </div>

      {featuredTeams.length > 0 ? (
        <Section title="Times populares" icon="star">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
            {featuredTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </Section>
      ) : null}

      {promoProducts.length > 0 ? (
        <Section title="Promoções" icon="fire">
          <ProductGrid products={promoProducts} />
        </Section>
      ) : null}

      {newArrivals.length > 0 ? (
        <Section title="Novidades" icon="sparkles">
          <ProductGrid products={newArrivals} />
        </Section>
      ) : null}

      {featuredProducts.length > 0 ? (
        <Section title="Destaques" icon="star">
          <ProductGrid products={featuredProducts} />
        </Section>
      ) : null}

      {nationalTeams.length > 0 ? (
        <Section title="Seleções" icon="trophy">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
            {nationalTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </Section>
      ) : null}

      {retroProducts.length > 0 ? (
        <Section title="Retrô" icon="clock">
          <ProductGrid products={retroProducts} />
        </Section>
      ) : null}

      {!hasContent ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
            <Shirt className="text-muted-foreground size-8" />
          </div>
          <p className="text-muted-foreground text-sm">
            Catálogo em preparação — volte em breve.
          </p>
        </div>
      ) : null}

      {store.whatsapp_number ? (
        <WhatsappCta
          phoneNumber={store.whatsapp_number}
          message={`Olá! Vi o catálogo da ${store.name} e gostaria de saber mais.`}
          className="fixed right-4 bottom-20 z-10 shadow-lg animate-pulse-slow"
        >
          Fale conosco
        </WhatsappCta>
      ) : null}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: "star" | "fire" | "sparkles" | "trophy" | "clock";
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        {icon === "star" ? (
          <span className="text-accent text-sm" aria-hidden="true">★</span>
        ) : icon === "fire" ? (
          <span className="text-sm" aria-hidden="true">🔥</span>
        ) : icon === "sparkles" ? (
          <span className="text-sm" aria-hidden="true">✨</span>
        ) : icon === "trophy" ? (
          <span className="text-sm" aria-hidden="true">🏆</span>
        ) : icon === "clock" ? (
          <span className="text-sm" aria-hidden="true">🕐</span>
        ) : null}
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products }: { products: Awaited<ReturnType<typeof listPublicProducts>> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
