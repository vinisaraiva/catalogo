import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("resolves conflicting Tailwind utility classes, last one wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("p-2", false && "hidden", undefined, null, "text-sm")).toBe("p-2 text-sm");
  });
});
