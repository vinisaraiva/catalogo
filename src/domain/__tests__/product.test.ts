import { describe, expect, it } from "vitest";
import { buildDuplicateProductInput } from "../product";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const baseProduct: ProductRow = {
  id: "11111111-1111-1111-1111-111111111111",
  store_id: "store-1",
  team_id: "team-1",
  collection_id: "collection-1",
  competition_id: "competition-1",
  name: "Camisa Flamengo Retrô 1981",
  slug: "camisa-flamengo-retro-1981",
  season: "1981",
  model: "Home",
  product_type: "Torcedor",
  description: "Descrição",
  price: 149.9,
  promotional_price: null,
  price_display_mode: "show_price",
  status: "active",
  featured: true,
  new_arrival: true,
  sort_order: 3,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("buildDuplicateProductInput", () => {
  it("copies classification and price fields", () => {
    const result = buildDuplicateProductInput(baseProduct, { slugSuffix: "000001" });
    expect(result.team_id).toBe(baseProduct.team_id);
    expect(result.collection_id).toBe(baseProduct.collection_id);
    expect(result.competition_id).toBe(baseProduct.competition_id);
    expect(result.product_type).toBe(baseProduct.product_type);
    expect(result.price).toBe(baseProduct.price);
    expect(result.price_display_mode).toBe(baseProduct.price_display_mode);
  });

  it("always resets the duplicate to draft, regardless of source status", () => {
    const result = buildDuplicateProductInput({ ...baseProduct, status: "active" });
    expect(result.status).toBe("draft");
  });

  it("resets featured and new_arrival", () => {
    const result = buildDuplicateProductInput(baseProduct);
    expect(result.featured).toBe(false);
    expect(result.new_arrival).toBe(false);
  });

  it("produces a distinct slug from the source", () => {
    const result = buildDuplicateProductInput(baseProduct, { slugSuffix: "abc123" });
    expect(result.slug).not.toBe(baseProduct.slug);
    expect(result.slug).toContain("abc123");
  });

  it("does not carry over the source id", () => {
    const result = buildDuplicateProductInput(baseProduct);
    expect(result).not.toHaveProperty("id");
  });
});
