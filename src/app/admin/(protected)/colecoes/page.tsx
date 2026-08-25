import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { listCollections } from "@/lib/queries/collections";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function CollectionsPage() {
  const { store } = await requireStoreMembership();
  const collections = await listCollections(store.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Coleções</h1>
        <Link href="/admin/colecoes/novo" className={buttonVariants({ size: "sm" })}>
          <Plus /> Nova
        </Link>
      </div>

      {collections.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma coleção cadastrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/admin/colecoes/${collection.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium">{collection.name}</span>
                  <Badge variant={collection.active ? "success" : "secondary"}>
                    {collection.active ? "Ativa" : "Inativa"}
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
