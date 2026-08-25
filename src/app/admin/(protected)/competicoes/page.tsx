import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { listCompetitions } from "@/lib/queries/competitions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function CompetitionsPage() {
  const { store } = await requireStoreMembership();
  const competitions = await listCompetitions(store.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Competições</h1>
        <Link href="/admin/competicoes/novo" className={buttonVariants({ size: "sm" })}>
          <Plus /> Nova
        </Link>
      </div>

      {competitions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma competição cadastrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {competitions.map((competition) => (
            <Link key={competition.id} href={`/admin/competicoes/${competition.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium">{competition.name}</span>
                  <Badge variant={competition.active ? "success" : "secondary"}>
                    {competition.active ? "Ativa" : "Inativa"}
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
