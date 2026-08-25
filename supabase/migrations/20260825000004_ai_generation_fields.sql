-- ============================================================================
-- AI generation workflow fields + AI model reference-pose Storage bucket —
-- Phase 6 (AI Foundation and Try-On)
--
-- `ai_generations` already exists (Phase 1) with the exact field set PRD.md
-- §11 lists (id, store_id, user_id, product_id, provider, model,
-- generation_type, status, cost_estimate, created_at). That field set has
-- no place to hold the actual generated-candidate image while it awaits
-- admin review (ARCHITECTURE.md §12's "Generated candidate -> Admin review
-- -> approve/discard" step), and no way to record *why* a generation
-- failed (CLAUDE.md "AI failures should be recorded distinctly from
-- successful generations" — the status enum already distinguishes failure,
-- but gives no detail for an admin or for debugging). Three small nullable
-- columns close that gap without introducing a new table:
--
--   result_image_url  — the candidate image produced by the provider, set
--                        when status becomes 'succeeded'. This is what the
--                        admin review screen previews.
--   product_image_id  — set when the admin approves: points at the
--                        `product_images` row created from
--                        `result_image_url` (image_type='generated',
--                        ai_generated=true). Lets a generation's outcome be
--                        traced forward to the catalog image it became.
--   error_message      — set when status becomes 'failed'.
--
-- See DECISIONS.md for the ADR recording this as a deviation-by-addition
-- (not a change) to the Phase 1 schema.
-- ============================================================================

alter table public.ai_generations
  add column if not exists result_image_url text,
  add column if not exists product_image_id uuid references public.product_images (id) on delete set null,
  add column if not exists error_message text;

create index if not exists ai_generations_product_image_id_idx
  on public.ai_generations (product_image_id);

-- ============================================================================
-- Storage bucket for AI model reference pose images
-- (CLAUDE.md "Storage conventions": `stores/{store_id}/ai-models/`).
--
-- Public, same tradeoff already accepted for the `product-images` bucket in
-- the Phase 5 migration (see its header comment / DECISIONS.md ADR-027):
-- these are generic reference photos of AI models/poses, not customer or
-- draft-product data, so there is nothing sensitive to gate behind a
-- signed-URL flow for the MVP.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-model-poses',
  'ai-model-poses',
  true,
  10485760, -- 10MB — same limit as product-images, see src/domain/product-image.ts
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- storage.foldername(name) on `stores/{store_id}/ai-models/{ai_model_id}/{file}`
-- puts store_id at segment [2], same convention as the product-images bucket.
drop policy if exists "ai_model_poses_storage_insert_own_store" on storage.objects;

create policy "ai_model_poses_storage_insert_own_store"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ai-model-poses'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "ai_model_poses_storage_update_own_store" on storage.objects;

create policy "ai_model_poses_storage_update_own_store"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ai-model-poses'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'ai-model-poses'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "ai_model_poses_storage_delete_own_store" on storage.objects;

create policy "ai_model_poses_storage_delete_own_store"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ai-model-poses'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );
