import { redirect } from "next/navigation";
import { getCurrentStoreMembership } from "@/lib/auth/get-current-store-membership";

/**
 * Shell for every /admin/* route except /admin/login (which is not nested
 * under this layout's protection — see route grouping below).
 *
 * Middleware (src/lib/supabase/middleware.ts) already redirects
 * unauthenticated requests before they reach here; this layout is the
 * server-side defense-in-depth check plus the "authenticated but not a
 * store member" state that middleware can't resolve on its own (that
 * requires a DB read).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentStoreMembership();

  if (membership.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (membership.status === "no_store") {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-lg font-semibold">Nenhuma loja associada</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          Sua conta está autenticada, mas não está associada a nenhuma loja. Entre em contato com o
          administrador do sistema.
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">{membership.store.name}</span>
      </header>
      <div className="p-4">{children}</div>
    </div>
  );
}
