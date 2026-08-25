import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { listProducts } from "@/lib/queries/products";
import { getPriceDisplay } from "@/domain/price";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/database";

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Rascunho",
  active: "Publicado",
  sold_out: "Esgotado",
  hidden: "Oculto",
};

const STATUS_BADGE_VARIANT: Record<
  ProductStatus,
  "secondary" | "success" | "warning" | "destructive"
> = {
  draft: "secondary",
  active: "success",
  sold_out: "warning",
  hidden: "destructive",
};

const FILTERS: { value: ProductStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Publicado" },
  { value: "sold_out", label: "Esgotado" },
  { value: "hidden", label: "Oculto" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = FILTERS.some((filter) => filter.value === rawStatus)
    ? (rawStatus as ProductStatus | "all" | undefined)
    : undefined;

  const { store } = await requireStoreMembership();
  const products = await listProducts(
    store.id,
    status && status !== "all" ? { status } : undefined,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Produtos</h1>
        <Link href="/admin/produtos/novo" className={buttonVariants({ size: "sm" })}>
          <Plus /> Novo produto
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((filter) => {
          const isActive = (status ?? "all") === filter.value;
          const href =
            filter.value === "all" ? "/admin/produtos" : `/admin/produtos?status=${filter.value}`;
          return (
            <Link
              key={filter.value}
              href={href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum produto encontrado.</p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => {
            const priceDisplay = getPriceDisplay({
              price: product.price,
              promotionalPrice: product.promotional_price,
              priceDisplayMode: product.price_display_mode,
            });

            return (
              <Link key={product.id} href={`/admin/produtos/${product.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {product.teams?.name ?? "Sem time"}
                        {priceDisplay.mode === "show_price" ? ` · ${priceDisplay.label}` : ""}
                        {priceDisplay.mode === "consult" ? ` · ${priceDisplay.label}` : ""}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[product.status]}>
                      {STATUS_LABEL[product.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
