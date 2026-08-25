import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { listTeams } from "@/lib/queries/teams";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const TEAM_TYPE_LABEL: Record<string, string> = {
  club: "Clube",
  national_team: "Seleção",
};

export default async function TeamsPage() {
  const { store } = await requireStoreMembership();
  const teams = await listTeams(store.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Times</h1>
        <Link href="/admin/times/novo" className={buttonVariants({ size: "sm" })}>
          <Plus /> Novo
        </Link>
      </div>

      {teams.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum time cadastrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <Link key={team.id} href={`/admin/times/${team.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {team.name}
                      {team.featured ? <Badge variant="warning">Destaque</Badge> : null}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {TEAM_TYPE_LABEL[team.type] ?? team.type}
                      {team.country ? ` · ${team.country}` : ""}
                    </p>
                  </div>
                  <Badge variant={team.active ? "success" : "secondary"}>
                    {team.active ? "Ativo" : "Inativo"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
