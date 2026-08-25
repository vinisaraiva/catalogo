import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getDashboardCounts } from "@/lib/queries/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/**
 * Admin dashboard (PRD §14). Shows active/draft/sold-out product counts
 * and the daily AI generation usage line. Shortcuts beyond "+ Novo
 * produto" (Modelos IA, Artes, Configurações) are added once those
 * sections exist (Phase 6/7/8) — TASKS.md Phase 2 doesn't require them.
 */
export default async function AdminDashboardPage() {
  const { store } = await requireStoreMembership();
  const counts = await getDashboardCounts(store.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Início</h1>
        <Link href="/admin/produtos/novo" className={buttonVariants({ size: "sm" })}>
          <Plus /> Novo produto
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Ativos" value={counts.activeProducts} />
        <StatCard label="Rascunhos" value={counts.draftProducts} />
        <StatCard label="Esgotados" value={counts.soldOutProducts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Gerações de IA hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {counts.aiUsedToday}{" "}
            <span className="text-muted-foreground text-base font-normal">
              de {counts.aiDailyLimit}
            </span>
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            A geração de imagens por IA chega na Fase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
