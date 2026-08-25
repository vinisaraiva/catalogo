import { describe, expect, it } from "vitest";
import { buildStoreLogoPath, extractStoreAssetStoragePath } from "../store-asset";

describe("buildStoreLogoPath", () => {
  it("builds a path under stores/{store_id}/logo/", () => {
    const path = buildStoreLogoPath({
      storeId: "store-1",
      mimeType: "image/png",
      fileId: "file-1",
    });
    expect(path).toBe("stores/store-1/logo/file-1.png");
  });

  it("falls back to .bin for an unrecognized mime type", () => {
    const path = buildStoreLogoPath({
      storeId: "s",
      mimeType: "application/octet-stream",
      fileId: "f",
    });
    expect(path.endsWith(".bin")).toBe(true);
  });
});

describe("extractStoreAssetStoragePath", () => {
  it("recovers the object path from a public URL", () => {
    const url = "https://xyz.supabase.co/storage/v1/object/public/store-assets/stores/s/logo/f.png";
    expect(extractStoreAssetStoragePath(url)).toBe("stores/s/logo/f.png");
  });

  it("returns null for a URL that isn't a public URL for this bucket", () => {
    expect(extractStoreAssetStoragePath("https://example.com/not-storage.png")).toBeNull();
  });
});
