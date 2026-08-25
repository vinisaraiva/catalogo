-- ============================================================================
-- Product image Storage bucket — Phase 5 (Product Images / Storage)
--
-- `public.product_images` (rows: url, image_type, sort_order, ...) already
-- exists and already has RLS (see 20260825000002_rls_policies.sql:
-- product_images_public_read_published / product_images_member_all). This
-- migration only adds the actual Supabase Storage bucket the uploaded files
-- live in, plus write policies on `storage.objects` for that bucket.
--
-- Path convention (ARCHITECTURE.md §15 / CLAUDE.md "Storage conventions"):
--   stores/{store_id}/products/{product_id}/{folder}/{uuid}.{ext}
-- `{folder}` groups the five `product_images.image_type` values into the
-- three conceptual folders ARCHITECTURE.md §15 actually names — see
-- `IMAGE_TYPE_FOLDER` in src/domain/product-image.ts for the mapping and
-- DECISIONS.md ADR-027 for why `detail` shares `original/` and
-- `social_feed`/`social_story` share `social/`.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true, -- public bucket: reads are served directly, bypassing storage.objects
        -- RLS entirely — see DECISIONS.md ADR-027 for why this is an
        -- accepted MVP tradeoff (paths are UUID-based and never surfaced
        -- for a draft/hidden product's rows via the already-RLS'd
        -- `product_images` table read).
  10485760, -- 10MB per file — see MAX_IMAGE_SIZE_BYTES in
            -- src/domain/product-image.ts (single source of truth for the
            -- app-level check; this is defense-in-depth at the Storage
            -- layer, not the primary validation).
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Write access: only a member of the store the path belongs to.
-- `storage.foldername(name)` splits an object path into its folder
-- segments (excluding the filename); for
-- `stores/{store_id}/products/{product_id}/{folder}/{file}`, segment [1] is
-- "stores" and segment [2] is the store_id.
--
-- No SELECT policy is created: the bucket above is public, so reads go
-- through the public object endpoint and never evaluate storage.objects
-- RLS at all. `product_images_public_read_published` (on the `product_images`
-- table itself) is what actually keeps a draft/hidden product's image URLs
-- from ever reaching an anonymous catalog request in the first place.
-- ----------------------------------------------------------------------------
create policy "product_images_storage_insert_own_store"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );

create policy "product_images_storage_update_own_store"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );

create policy "product_images_storage_delete_own_store"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );
