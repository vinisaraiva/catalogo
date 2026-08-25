/**
 * Product page placeholder. Implemented in Phase 3 (Public Catalog).
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="p-8">
      <p className="text-muted-foreground text-sm">Produto: {slug} (em construção)</p>
    </main>
  );
}
