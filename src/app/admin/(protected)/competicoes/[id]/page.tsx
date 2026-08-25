import { notFound } from "next/navigation";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getCompetition } from "@/lib/queries/competitions";
import { SimpleEntityForm } from "@/components/admin/simple-entity-form";
import { createCompetition, updateCompetition } from "@/lib/actions/competitions";

export default async function EditCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireStoreMembership();
  const competition = await getCompetition(store.id, id);
  if (!competition) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Editar competição</h1>
      <SimpleEntityForm
        entityLabel="competição"
        redirectPath="/admin/competicoes"
        createAction={createCompetition}
        updateAction={updateCompetition}
        initialData={competition}
      />
    </div>
  );
}
