import type { ProductImageType } from "@/types/database";

/**
 * PRD §7 "Validate mime type" — accepted upload formats. Keeping this to
 * three well-supported raster formats (no HEIC, no SVG) avoids needing a
 * server-side conversion step in the MVP; a phone set to save HEIC photos
 * already re-encodes to JPEG on share/upload in practice.
 */
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * PRD §7 "Validate file size". Not specified numerically in the PRD — 10MB
 * comfortably covers a modern phone's camera output while still catching
 * mistaken non-photo uploads. Documented assumption, not a PRD requirement
 * (CLAUDE.md "choose the simplest solution, document important
 * assumptions"). Mirrored at the Storage layer via the bucket's
 * `file_size_limit` (see the Phase 5 migration) as defense-in-depth, not as
 * the primary check — this constant is the single source of truth.
 */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Caps how many files one upload call accepts, so a single request can't
 * balloon past Next.js's Server Action body size limit (raised, but not
 * unlimited — see next.config.ts).
 */
export const MAX_FILES_PER_UPLOAD = 5;

export function isAllowedImageMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedImageSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_IMAGE_SIZE_BYTES;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Maps the five `product_images.image_type` values onto the three folders
 * ARCHITECTURE.md §15 actually names (`original/`, `generated/`,
 * `social/`). `detail` is a traditional admin upload just like `original`,
 * so it shares that folder; `social_feed`/`social_story` are both
 * deterministic derivatives of one approved image (CLAUDE.md "Image
 * generation for social media"), so they share `social/`. This mapping is
 * written now (Phase 5) so Phase 6/7's AI-generated types don't need to
 * touch this function again.
 */
const IMAGE_TYPE_FOLDER: Record<ProductImageType, string> = {
  original: "original",
  detail: "original",
  generated: "generated",
  social_feed: "social",
  social_story: "social",
};

/**
 * Builds a collision-safe Storage object path per ARCHITECTURE.md §15 /
 * CLAUDE.md "Storage conventions":
 * `stores/{store_id}/products/{product_id}/{folder}/{uuid}.{ext}`.
 *
 * `fileId` is caller-supplied (rather than generated in here with
 * `crypto.randomUUID()`) so this function stays pure and trivially
 * testable — it's the uuid segment, not the original filename, that
 * prevents two uploads both named `foto.jpg` from colliding.
 */
export function buildProductImagePath(input: {
  storeId: string;
  productId: string;
  imageType: ProductImageType;
  mimeType: string;
  fileId: string;
}): string {
  const folder = IMAGE_TYPE_FOLDER[input.imageType];
  const extension = MIME_EXTENSIONS[input.mimeType] ?? "bin";
  return `stores/${input.storeId}/products/${input.productId}/${folder}/${input.fileId}.${extension}`;
}

/**
 * Recovers a Storage object path from one of its own public URLs — needed
 * to delete the underlying file "safely" (TASKS.md Phase 5: "Delete image
 * safely"), since `product_images.url` stores the full public URL, not the
 * bare path. Returns null for a URL that isn't a public URL for this
 * bucket (defensive — should not happen for rows this app itself wrote).
 */
export function extractStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path || null;
}
