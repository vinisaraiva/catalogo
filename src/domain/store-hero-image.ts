/**
 * Storage path helper for the Home hero photos (DECISIONS.md ADR-035),
 * stored in the same `store-assets` bucket as the catalog logo
 * (`store-asset.ts`) under a different subfolder — its write policies are
 * already scoped generically by the path's `store_id` segment, not by a
 * "logo"-specific filename, so no new bucket/policy was needed.
 */

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function buildStoreHeroImagePath(input: {
  storeId: string;
  mimeType: string;
  fileId: string;
}): string {
  const extension = MIME_EXTENSIONS[input.mimeType] ?? "bin";
  return `stores/${input.storeId}/hero/${input.fileId}.${extension}`;
}

export function extractStoreHeroImageStoragePath(url: string, bucket = "store-assets"): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path || null;
}
