-- ============================================================================
-- Store hero images — Home hero photo, admin-manageable
--
-- DECISIONS.md ADR-034 shipped the Home hero's background photo as four
-- fixed static files under `public/hero/`. The user then asked for these
-- photos to be admin-editable instead (upload/replace/remove from
-- Configurações, no redeploy needed) — this table plus the actions/UI in
-- the same change replace that static approach. See DECISIONS.md ADR-035.
--
-- One row per photo, `store_id`-scoped like every other store-owned
-- entity (CLAUDE.md "Multi-store-ready architecture"). No fixed count and
-- no `image_type`/`product_id` — unlike `product_images` this isn't
-- attached to a product, it's a small pool of marketing photos the
-- storefront Home picks one of at random per request.
-- ============================================================================

create table if not exists public.store_hero_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists store_hero_images_store_id_idx
  on public.store_hero_images (store_id, sort_order);

alter table public.store_hero_images enable row level security;

drop policy if exists "store_hero_images_public_read" on public.store_hero_images;

create policy "store_hero_images_public_read"
  on public.store_hero_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_hero_images.store_id
        and s.active = true
    )
  );

drop policy if exists "store_hero_images_member_all" on public.store_hero_images;

create policy "store_hero_images_member_all"
  on public.store_hero_images for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ----------------------------------------------------------------------------
-- Storage: reuses the existing `store-assets` bucket (created in ADR-029
-- for the store logo) under a new `stores/{store_id}/hero/` path. Its
-- Storage RLS policies scope writes generically by the object path's
-- store_id segment (storage.foldername(name)[2]), not by a
-- "logo"-specific subfolder, so no new Storage policy is needed here.
-- ----------------------------------------------------------------------------
