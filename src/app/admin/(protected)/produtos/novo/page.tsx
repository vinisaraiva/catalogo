import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { listTeams } from "@/lib/queries/teams";
import { listCollections } from "@/lib/queries/collections";
import { listCompetitions } from "@/lib/queries/competitions";
import { ProductWizard } from "@/components/admin/product-wizard";

export default async function NewProductPage() {
  const { store } = await requireStoreMembership();
  const [teams, collections, competitions] = await Promise.all([
    listTeams(store.id),
    listCollections(store.id),
    listCompetitions(store.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Novo produto</h1>
      <ProductWizard
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
