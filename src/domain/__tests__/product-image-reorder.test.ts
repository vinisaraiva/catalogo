import { describe, expect, it } from "vitest";
import { isValidReorder } from "../product-image-reorder";

describe("isValidReorder", () => {
  it("accepts a genuine reordering of the same ids", () => {
    expect(isValidReorder(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });

  it("accepts an unchanged order", () => {
    expect(isValidReorder(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("rejects a duplicated id standing in for a missing one", () => {
    // The bug this function fixes: same length, every id technically
    // present in currentIds, but "b" is missing and "a" appears twice.
    expect(isValidReorder(["a", "b"], ["a", "a"])).toBe(false);
  });

  it("rejects a missing id even without a duplicate", () => {
    expect(isValidReorder(["a", "b", "c"], ["a", "b"])).toBe(false);
  });

  it("rejects an id that doesn't belong to the current set", () => {
    expect(isValidReorder(["a", "b"], ["a", "z"])).toBe(false);
  });

  it("treats two empty lists as valid (nothing to reorder)", () => {
    expect(isValidReorder([], [])).toBe(true);
  });
});
