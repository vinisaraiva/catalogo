import { describe, expect, it } from "vitest";
import { isQuotaAvailable, remainingQuota } from "../ai-quota";

describe("isQuotaAvailable", () => {
  it("is available when usage is below the limit", () => {
    expect(isQuotaAvailable(10, 7)).toBe(true);
  });

  it("is not available once usage reaches the limit", () => {
    expect(isQuotaAvailable(10, 10)).toBe(false);
  });

  it("is not available when usage exceeds the limit", () => {
    expect(isQuotaAvailable(10, 11)).toBe(false);
  });

  it("treats a zero limit as always exhausted", () => {
    expect(isQuotaAvailable(0, 0)).toBe(false);
  });
});

describe("remainingQuota", () => {
  it("returns the difference between limit and usage", () => {
    expect(remainingQuota(10, 7)).toBe(3);
  });

  it("never goes negative", () => {
    expect(remainingQuota(10, 15)).toBe(0);
  });
});
