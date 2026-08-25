import { SimpleEntityForm } from "@/components/admin/simple-entity-form";
import { createCollection, updateCollection } from "@/lib/actions/collections";

export default function NewCollectionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Nova coleção</h1>
      <SimpleEntityForm
        entityLabel="coleção"
        redirectPath="/admin/colecoes"
        createAction={createCollection}
        updateAction={updateCollection}
      />
    </div>
  );
}
