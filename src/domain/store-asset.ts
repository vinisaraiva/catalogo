/**
 * Storage path helper for store-level assets (currently just the catalog
 * logo — PRD.md §7 `stores.logo_url`, rendered in the storefront header,
 * `src/app/(storefront)/layout.tsx`). Mirrors `product-image.ts` /
 * `ai-model-pose-image.ts`'s path builders for a third bucket
 * (`store-assets`, see the Phase 6 follow-up migration), kept as its own
 * module since it targets a different bucket with its own path shape.
 */

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * `stores/{store_id}/logo/{uuid}.{ext}` — same `stores/{store_id}/...`
 * prefix convention as the other two buckets (CLAUDE.md "Storage
 * conventions"), so `storage.foldername(name)[2]` is the store id in the
 * RLS policy exactly like it is for `product-images`/`ai-model-poses`.
 */
export function buildStoreLogoPath(input: {
  storeId: string;
  mimeType: string;
  fileId: string;
}): string {
  const extension = MIME_EXTENSIONS[input.mimeType] ?? "bin";
  return `stores/${input.storeId}/logo/${input.fileId}.${extension}`;
}

export function extractStoreAssetStoragePath(url: string, bucket = "store-assets"): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path || null;
}
