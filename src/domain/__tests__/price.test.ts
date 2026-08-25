import { describe, expect, it } from "vitest";
import { getPriceDisplay, formatCurrency } from "../price";

describe("getPriceDisplay", () => {
  it("hides the price block entirely for hidden mode", () => {
    expect(
      getPriceDisplay({ price: 100, promotionalPrice: null, priceDisplayMode: "hidden" }),
    ).toEqual({ mode: "hidden" });
  });

  it("returns the consult CTA for consult mode, ignoring any stored price", () => {
    const result = getPriceDisplay({ price: 100, promotionalPrice: null, priceDisplayMode: "consult" });
    expect(result.mode).toBe("consult");
    if (result.mode === "consult") {
      expect(result.label).toBe("Consultar valor");
      expect(result.whatsappCta).toBe("Consultar pelo WhatsApp");
    }
  });

  it("formats a plain price for show_price with no promotion", () => {
    const result = getPriceDisplay({ price: 149.9, promotionalPrice: null, priceDisplayMode: "show_price" });
    expect(result.mode).toBe("show_price");
    if (result.mode === "show_price") {
      expect(result.label).toBe(formatCurrency(149.9));
      expect(result.hasPromotion).toBe(false);
      expect(result.originalLabel).toBeNull();
    }
  });

  it("prefers the promotional price and keeps the original as a reference when lower", () => {
    const result = getPriceDisplay({
      price: 200,
      promotionalPrice: 149.9,
      priceDisplayMode: "show_price",
    });
    expect(result.mode).toBe("show_price");
    if (result.mode === "show_price") {
      expect(result.label).toBe(formatCurrency(149.9));
      expect(result.originalLabel).toBe(formatCurrency(200));
      expect(result.hasPromotion).toBe(true);
    }
  });

  it("ignores a promotional price that is not actually lower than the price", () => {
    const result = getPriceDisplay({
      price: 100,
      promotionalPrice: 150,
      priceDisplayMode: "show_price",
    });
    expect(result.mode).toBe("show_price");
    if (result.mode === "show_price") {
      expect(result.label).toBe(formatCurrency(100));
      expect(result.hasPromotion).toBe(false);
    }
  });

  it("falls back to consult when show_price has no price configured", () => {
    const result = getPriceDisplay({ price: null, promotionalPrice: null, priceDisplayMode: "show_price" });
    expect(result.mode).toBe("consult");
  });
});
