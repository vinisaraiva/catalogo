import { notFound } from "next/navigation";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getCollection } from "@/lib/queries/collections";
import { SimpleEntityForm } from "@/components/admin/simple-entity-form";
import { createCollection, updateCollection } from "@/lib/actions/collections";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireStoreMembership();
  const collection = await getCollection(store.id, id);
  if (!collection) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Editar coleção</h1>
      <SimpleEntityForm
        entityLabel="coleção"
        redirectPath="/admin/colecoes"
        createAction={createCollection}
        updateAction={updateCollection}
        initialData={collection}
      />
    </div>
  );
}
