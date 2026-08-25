import { describe, expect, it } from "vitest";
import { buildSelectionMessage, buildSingleProductMessage, buildWhatsappUrl } from "../whatsapp";

describe("buildWhatsappUrl", () => {
  it("strips non-digit characters from the phone number", () => {
    expect(buildWhatsappUrl("+55 (71) 99999-0000")).toBe("https://wa.me/5571999990000");
  });

  it("omits the text param entirely when no message is given", () => {
    expect(buildWhatsappUrl("5571999990000")).toBe("https://wa.me/5571999990000");
  });

  it("URL-encodes the message", () => {
    const url = buildWhatsappUrl("5571999990000", "Olá! Tudo bem?");
    expect(url).toBe(`https://wa.me/5571999990000?text=${encodeURIComponent("Olá! Tudo bem?")}`);
  });
});

describe("buildSingleProductMessage", () => {
  it("uses the 'consultar' wording (PRD §23 example) for consult mode with a size", () => {
    const message = buildSingleProductMessage({
      productName: "a Camisa Flamengo Retrô 1981",
      size: "G",
      priceDisplayMode: "consult",
    });
    expect(message).toBe(
      "Olá! Vi a Camisa Flamengo Retrô 1981 no catálogo e gostaria de consultar o tamanho G.",
    );
  });

  it("uses the 'interesse' wording (ARCHITECTURE.md §18 example) for show_price mode with a size", () => {
    const message = buildSingleProductMessage({
      productName: "a Camisa Flamengo Retrô 1981",
      size: "G",
      priceDisplayMode: "show_price",
    });
    expect(message).toBe(
      "Olá! Vi a Camisa Flamengo Retrô 1981 no catálogo e tenho interesse no tamanho G.",
    );
  });

  it("uses the 'interesse' wording for hidden mode too", () => {
    const message = buildSingleProductMessage({
      productName: "Camisa X",
      size: "M",
      priceDisplayMode: "hidden",
    });
    expect(message).toContain("tenho interesse no tamanho M");
  });

  it("omits size wording entirely when no size is given", () => {
    expect(
      buildSingleProductMessage({ productName: "Camisa X", priceDisplayMode: "consult" }),
    ).toBe("Olá! Vi Camisa X no catálogo e gostaria de consultar.");
    expect(
      buildSingleProductMessage({ productName: "Camisa X", priceDisplayMode: "show_price" }),
    ).toBe("Olá! Vi Camisa X no catálogo e tenho interesse.");
  });

  it("appends the product URL on its own line when given", () => {
    const message = buildSingleProductMessage({
      productName: "Camisa X",
      size: "M",
      priceDisplayMode: "consult",
      productUrl: "https://example.com/produto/camisa-x",
    });
    expect(message).toBe(
      "Olá! Vi Camisa X no catálogo e gostaria de consultar o tamanho M.\nhttps://example.com/produto/camisa-x",
    );
  });

  it("does not append a URL line when none is given", () => {
    const message = buildSingleProductMessage({
      productName: "Camisa X",
      priceDisplayMode: "consult",
    });
    expect(message).not.toContain("\n");
  });
});

describe("buildSelectionMessage", () => {
  it("returns an empty string for an empty selection", () => {
    expect(buildSelectionMessage([])).toBe("");
  });

  it("builds a singular-intro message for one item", () => {
    const message = buildSelectionMessage([
      {
        productId: "p1",
        productName: "Camisa Flamengo Retrô 1981",
        productUrl: "https://example.com/produto/flamengo-1981",
        size: "G",
      },
    ]);
    expect(message).toBe(
      "Olá! Tenho interesse neste produto:\n\n1. Camisa Flamengo Retrô 1981 — tamanho G\nhttps://example.com/produto/flamengo-1981",
    );
  });

  it("builds a numbered, plural-intro message listing every product, size and link", () => {
    const message = buildSelectionMessage([
      {
        productId: "p1",
        productName: "Camisa Flamengo Retrô 1981",
        productUrl: "https://example.com/produto/flamengo-1981",
        size: "G",
      },
      {
        productId: "p2",
        productName: "Camisa Vasco Home 2024",
        productUrl: "https://example.com/produto/vasco-2024",
        size: "M",
      },
    ]);
    expect(message).toBe(
      [
        "Olá! Tenho interesse nestes produtos:",
        "",
        "1. Camisa Flamengo Retrô 1981 — tamanho G",
        "https://example.com/produto/flamengo-1981",
        "",
        "2. Camisa Vasco Home 2024 — tamanho M",
        "https://example.com/produto/vasco-2024",
      ].join("\n"),
    );
  });

  it("omits the size label and URL line when an item has neither", () => {
    const message = buildSelectionMessage([
      { productId: "p1", productName: "Camisa X", productUrl: "", size: null },
    ]);
    expect(message).toBe("Olá! Tenho interesse neste produto:\n\n1. Camisa X");
  });
});
