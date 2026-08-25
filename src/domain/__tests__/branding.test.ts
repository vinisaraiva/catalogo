import { describe, expect, it } from "vitest";
import { buildManifestShortName, resolveStoreIconInitial } from "../branding";

describe("resolveStoreIconInitial", () => {
  it("returns the uppercased first letter of the store name", () => {
    expect(resolveStoreIconInitial("camisas do zé")).toBe("C");
  });

  it("ignores leading whitespace", () => {
    expect(resolveStoreIconInitial("  Loja")).toBe("L");
  });

  it("falls back to C for an empty name", () => {
    expect(resolveStoreIconInitial("   ")).toBe("C");
  });
});

describe("buildManifestShortName", () => {
  it("returns the name unchanged when it already fits", () => {
    expect(buildManifestShortName("Camisas FC")).toBe("Camisas FC");
  });

  it("truncates a long name to the max length", () => {
    expect(buildManifestShortName("Camisas do Zé Esportes", 12)).toBe("Camisas do Z");
  });

  it("trims trailing whitespace left by truncation", () => {
    expect(buildManifestShortName("Camisas do Zé", 8)).toBe("Camisas");
  });
});
