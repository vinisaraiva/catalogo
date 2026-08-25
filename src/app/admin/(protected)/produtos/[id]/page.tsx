import { notFound } from "next/navigation";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getProduct, listProductImages, listProductSizes } from "@/lib/queries/products";
import { listTeams } from "@/lib/queries/teams";
import { listCollections } from "@/lib/queries/collections";
import { listCompetitions } from "@/lib/queries/competitions";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { ProductStatusActions } from "@/components/admin/product-status-actions";
import { ProductSizesManager } from "@/components/admin/product-sizes-manager";
import { ProductImagesManager } from "@/components/admin/product-images-manager";
import { Separator } from "@/components/ui/separator";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireStoreMembership();

  const [product, sizes, images, teams, collections, competitions] = await Promise.all([
    getProduct(store.id, id),
    listProductSizes(store.id, id),
    listProductImages(store.id, id),
    listTeams(store.id),
    listCollections(store.id),
    listCompetitions(store.id),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Editar produto</h1>

      <ProductStatusActions productId={product.id} status={product.status} />

      <Separator />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Fotos</h2>
        <ProductImagesManager productId={product.id} initialImages={images} />
      </div>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Tamanhos e estoque</h2>
        <ProductSizesManager productId={product.id} initialSizes={sizes} />
      </div>

      <Separator />

      <ProductEditForm
        initialData={{
          id: product.id,
          team_id: product.team_id,
          collection_id: product.collection_id,
          competition_id: product.competition_id,
          name: product.name,
          slug: product.slug,
          season: product.season,
          model: product.model,
          product_type: product.product_type,
          description: product.description,
          price: product.price,
          promotional_price: product.promotional_price,
          price_display_mode: product.price_display_mode,
          featured: product.featured,
          new_arrival: product.new_arrival,
          sort_order: product.sort_order,
        }}
        teams={teams.map((team) => ({ id: team.id, name: team.name }))}
        collections={collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
        }))}
        competitions={competitions.map((competition) => ({
          id: competition.id,
          name: competition.name,
        }))}
      />
    </div>
  );
}
