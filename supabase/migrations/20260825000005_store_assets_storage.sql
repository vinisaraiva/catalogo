-- ============================================================================
-- Store assets Storage bucket (catalog logo) — Phase 2 follow-up
--
-- Gap found after Phase 6: PRD.md §7 defines `stores.logo_url` /
-- `stores.whatsapp_number` / `stores.instagram_url`, and the storefront
-- already reads them (`src/app/(storefront)/layout.tsx` renders the logo,
-- the WhatsApp CTAs on `/`, `/produto/[slug]` and `SelectionBar` are all
-- conditional on `whatsapp_number` being set) — but TASKS.md never listed
-- "edit the store's own profile" as an admin checklist item, so no action
-- ever wrote to those columns except `scripts/seed.ts` (which doesn't set
-- any of the three). Without this, the catalog has no logo and the
-- WhatsApp buttons never render. See DECISIONS.md ADR-029.
--
-- `stores.name`/`whatsapp_number`/`instagram_url` need no schema change —
-- `stores_member_update_own` (20260825000002_rls_policies.sql) already
-- allows a store member to update their own store row. This migration
-- only adds the Storage bucket the logo file itself is uploaded to.
--
-- Path convention: `stores/{store_id}/logo/{uuid}.{ext}` — same
-- `stores/{store_id}/...` prefix as `product-images`/`ai-model-poses`, so
-- `storage.foldername(name)[2]` is the store id here too.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true, -- public, same tradeoff as product-images/ai-model-poses (see those
        -- migrations' header comments) — a store's logo is meant to be
        -- publicly visible in the catalog anyway.
  10485760, -- 10MB — same limit as the other two buckets
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "store_assets_storage_insert_own_store" on storage.objects;

create policy "store_assets_storage_insert_own_store"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-assets'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "store_assets_storage_update_own_store" on storage.objects;

create policy "store_assets_storage_update_own_store"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-assets'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'store-assets'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "store_assets_storage_delete_own_store" on storage.objects;

create policy "store_assets_storage_delete_own_store"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-assets'
    and public.is_store_member(((storage.foldername(name))[2])::uuid)
  );
