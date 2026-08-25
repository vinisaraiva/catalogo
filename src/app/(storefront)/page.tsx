/**
 * Public storefront home.
 *
 * Placeholder for Phase 1 (Foundation). Full storefront home (search,
 * featured teams, new arrivals, promotions) is implemented in Phase 3
 * per TASKS.md. Kept intentionally minimal here.
 */
export default function StorefrontHomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">Catálogo</h1>
      <p className="text-muted-foreground text-sm">
        Em breve: catálogo público de camisas esportivas.
      </p>
    </main>
  );
}
