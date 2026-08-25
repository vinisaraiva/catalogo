/**
 * Team page placeholder. Implemented in Phase 3 (Public Catalog).
 */
export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="p-8">
      <p className="text-muted-foreground text-sm">Time: {slug} (em construção)</p>
    </main>
  );
}
