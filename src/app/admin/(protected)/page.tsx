import { getCurrentStoreMembership } from "@/lib/auth/get-current-store-membership";

/**
 * Admin dashboard placeholder. Full dashboard (product counts, AI usage,
 * shortcuts per PRD §14) is implemented in Phase 2 — Admin Core.
 */
export default async function AdminDashboardPage() {
  const membership = await getCurrentStoreMembership();
  const storeName = membership.status === "ok" ? membership.store.name : "";

  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold">Início</h1>
      <p className="text-muted-foreground text-sm">
        Bem-vindo(a){storeName ? `, ${storeName}` : ""}. O painel completo será construído na Fase
        2.
      </p>
    </div>
  );
}
