import { SimpleEntityForm } from "@/components/admin/simple-entity-form";
import { createCompetition, updateCompetition } from "@/lib/actions/competitions";

export default function NewCompetitionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Nova competição</h1>
      <SimpleEntityForm
        entityLabel="competição"
        redirectPath="/admin/competicoes"
        createAction={createCompetition}
        updateAction={updateCompetition}
      />
    </div>
  );
}
