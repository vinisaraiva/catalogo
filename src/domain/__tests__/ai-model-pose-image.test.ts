import { describe, expect, it } from "vitest";
import { buildAiModelPoseImagePath, extractAiModelPoseStoragePath } from "../ai-model-pose-image";

describe("buildAiModelPoseImagePath", () => {
  it("builds a path grouped by store then AI model", () => {
    const path = buildAiModelPoseImagePath({
      storeId: "store-1",
      aiModelId: "model-1",
      mimeType: "image/png",
      fileId: "file-1",
    });
    expect(path).toBe("stores/store-1/ai-models/model-1/file-1.png");
  });

  it("falls back to .bin for an unrecognized mime type", () => {
    const path = buildAiModelPoseImagePath({
      storeId: "s",
      aiModelId: "m",
      mimeType: "application/octet-stream",
      fileId: "f",
    });
    expect(path.endsWith(".bin")).toBe(true);
  });
});

describe("extractAiModelPoseStoragePath", () => {
  it("recovers the object path from a public URL", () => {
    const url =
      "https://xyz.supabase.co/storage/v1/object/public/ai-model-poses/stores/s/ai-models/m/f.png";
    expect(extractAiModelPoseStoragePath(url)).toBe("stores/s/ai-models/m/f.png");
  });

  it("returns null for a URL that isn't a public URL for this bucket", () => {
    expect(extractAiModelPoseStoragePath("https://example.com/not-storage.png")).toBeNull();
  });
});
