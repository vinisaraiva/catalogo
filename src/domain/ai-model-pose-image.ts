/**
 * Storage path helper for AI model reference pose photos (CLAUDE.md
 * "Storage conventions": `stores/{store_id}/ai-models/`), mirroring
 * `src/domain/product-image.ts`'s `buildProductImagePath` /
 * `extractStoragePathFromPublicUrl` for the `product-images` bucket. Kept
 * as a separate small module rather than folded into `product-image.ts`
 * because it targets a different bucket (`ai-model-poses`, see the Phase 6
 * migration) with a different, product-independent path shape.
 */

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * `stores/{store_id}/ai-models/{ai_model_id}/{uuid}.{ext}` — grouping by
 * `ai_model_id` (rather than by pose) keeps every reference photo for one
 * model together, which is how the admin UI browses them.
 */
export function buildAiModelPoseImagePath(input: {
  storeId: string;
  aiModelId: string;
  mimeType: string;
  fileId: string;
}): string {
  const extension = MIME_EXTENSIONS[input.mimeType] ?? "bin";
  return `stores/${input.storeId}/ai-models/${input.aiModelId}/${input.fileId}.${extension}`;
}

/** Same recovery logic as `extractStoragePathFromPublicUrl`, scoped to the
 * `ai-model-poses` bucket — needed to delete/replace a pose's reference
 * photo. */
export function extractAiModelPoseStoragePath(
  url: string,
  bucket = "ai-model-poses",
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path || null;
}
