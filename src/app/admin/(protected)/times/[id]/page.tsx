import { notFound } from "next/navigation";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getTeam } from "@/lib/queries/teams";
import { TeamForm } from "@/components/admin/team-form";

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store } = await requireStoreMembership();
  const team = await getTeam(store.id, id);
  if (!team) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Editar time</h1>
      <TeamForm
        initialData={{
          id: team.id,
          name: team.name,
          slug: team.slug,
          type: team.type,
          country: team.country,
          logo_url: team.logo_url,
          featured: team.featured,
          active: team.active,
          sort_order: team.sort_order,
        }}
      />
    </div>
  );
}
