import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { listAiModels } from "@/lib/queries/ai-models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function AiModelsPage() {
  const { store } = await requireStoreMembership();
  const models = await listAiModels(store.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Modelos de IA</h1>
        <Link href="/admin/ia/modelos/novo" className={buttonVariants({ size: "sm" })}>
          <Plus /> Novo
        </Link>
      </div>
      <p className="text-muted-foreground text-sm">
        Cadastre modelos e poses aprovadas para o gerador de imagens com IA (Virtual Try-On).
      </p>

      {models.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum modelo cadastrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {models.map((model) => (
            <Link key={model.id} href={`/admin/ia/modelos/${model.id}`}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium">{model.name}</span>
                  <Badge variant={model.active ? "success" : "secondary"}>
                    {model.active ? "Ativo" : "Inativo"}
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
