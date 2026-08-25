import { describe, expect, it } from "vitest";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  buildProductImagePath,
  extractStoragePathFromPublicUrl,
  isAllowedImageMimeType,
  isAllowedImageSize,
} from "../product-image";

describe("isAllowedImageMimeType", () => {
  it.each(ALLOWED_IMAGE_MIME_TYPES)("accepts %s", (mimeType) => {
    expect(isAllowedImageMimeType(mimeType)).toBe(true);
  });

  it("rejects an unsupported mime type", () => {
    expect(isAllowedImageMimeType("image/gif")).toBe(false);
    expect(isAllowedImageMimeType("application/pdf")).toBe(false);
  });
});

describe("isAllowedImageSize", () => {
  it("accepts a size within the limit", () => {
    expect(isAllowedImageSize(1024)).toBe(true);
    expect(isAllowedImageSize(MAX_IMAGE_SIZE_BYTES)).toBe(true);
  });

  it("rejects a size over the limit", () => {
    expect(isAllowedImageSize(MAX_IMAGE_SIZE_BYTES + 1)).toBe(false);
  });

  it("rejects a zero or negative size", () => {
    expect(isAllowedImageSize(0)).toBe(false);
    expect(isAllowedImageSize(-10)).toBe(false);
  });
});

describe("buildProductImagePath", () => {
  it("builds the conceptual stores/.../products/.../{folder}/{uuid}.{ext} path", () => {
    const path = buildProductImagePath({
      storeId: "store-1",
      productId: "product-1",
      imageType: "original",
      mimeType: "image/jpeg",
      fileId: "file-uuid-1",
    });
    expect(path).toBe("stores/store-1/products/product-1/original/file-uuid-1.jpg");
  });

  it("groups 'detail' under the original/ folder", () => {
    const path = buildProductImagePath({
      storeId: "store-1",
      productId: "product-1",
      imageType: "detail",
      mimeType: "image/png",
      fileId: "file-uuid-2",
    });
    expect(path).toBe("stores/store-1/products/product-1/original/file-uuid-2.png");
  });

  it("groups both social types under the social/ folder", () => {
    const feedPath = buildProductImagePath({
      storeId: "store-1",
      productId: "product-1",
      imageType: "social_feed",
      mimeType: "image/webp",
      fileId: "file-uuid-3",
    });
    const storyPath = buildProductImagePath({
      storeId: "store-1",
      productId: "product-1",
      imageType: "social_story",
      mimeType: "image/webp",
      fileId: "file-uuid-4",
    });
    expect(feedPath).toBe("stores/store-1/products/product-1/social/file-uuid-3.webp");
    expect(storyPath).toBe("stores/store-1/products/product-1/social/file-uuid-4.webp");
  });

  it("maps 'generated' to its own folder", () => {
    const path = buildProductImagePath({
      storeId: "store-1",
      productId: "product-1",
      imageType: "generated",
      mimeType: "image/jpeg",
      fileId: "file-uuid-5",
    });
    expect(path).toBe("stores/store-1/products/product-1/generated/file-uuid-5.jpg");
  });

  it("falls back to a .bin extension for an unmapped mime type", () => {
    const path = buildProductImagePath({
      storeId: "store-1",
      productId: "product-1",
      imageType: "original",
      mimeType: "image/gif",
      fileId: "file-uuid-6",
    });
    expect(path).toBe("stores/store-1/products/product-1/original/file-uuid-6.bin");
  });
});

describe("extractStoragePathFromPublicUrl", () => {
  it("recovers the object path from a public URL", () => {
    const url =
      "https://hpjrqvofunloikgyzmzz.supabase.co/storage/v1/object/public/product-images/stores/store-1/products/product-1/original/abc.jpg";
    expect(extractStoragePathFromPublicUrl(url, "product-images")).toBe(
      "stores/store-1/products/product-1/original/abc.jpg",
    );
  });

  it("returns null for a URL that isn't a public URL for that bucket", () => {
    expect(
      extractStoragePathFromPublicUrl("https://example.com/foo.jpg", "product-images"),
    ).toBeNull();
  });

  it("returns null for the right bucket marker but a different bucket name", () => {
    const url =
      "https://x.supabase.co/storage/v1/object/public/other-bucket/stores/store-1/foo.jpg";
    expect(extractStoragePathFromPublicUrl(url, "product-images")).toBeNull();
  });
});
