import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database, ProductStatus } from "@/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductSizeRow = Database["public"]["Tables"]["product_sizes"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductWithRelations = ProductRow & {
  teams: { id: string; name: string } | null;
  collections: { id: string; name: string } | null;
  competitions: { id: string; name: string } | null;
};

export async function listProducts(
  storeId: string,
  filter?: { status?: ProductStatus },
): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, teams(id, name), collections(id, name), competitions(id, name)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (filter?.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list products: ${error.message}`);
  return (data ?? []) as unknown as ProductWithRelations[];
}

export async function getProduct(storeId: string, id: string): Promise<ProductRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data;
}

export async function listProductSizes(
  storeId: string,
  productId: string,
): Promise<ProductSizeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_sizes")
    .select("*")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("size", { ascending: true });

  if (error) throw new Error(`Failed to list product sizes: ${error.message}`);
  return data ?? [];
}

export async function listProductImages(
  storeId: string,
  productId: string,
): Promise<ProductImageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to list product images: ${error.message}`);
  return data ?? [];
}
