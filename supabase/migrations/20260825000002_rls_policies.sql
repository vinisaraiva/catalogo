-- ============================================================================
-- Row Level Security — Phase 1 (Foundation)
--
-- Model (CLAUDE.md "Security" / ARCHITECTURE.md §10):
--   Public (anon + authenticated): read-only, limited to published catalog
--     data belonging to an active store.
--   Store member (authenticated user present in store_users for the row's
--     store_id): full CRUD on that store's data.
-- RLS is enforced at the database layer; frontend/route guards are not
-- sufficient on their own.
--
-- Every `create policy` below is preceded by `drop policy if exists` so
-- this file can be safely re-run against a database that already has some
-- or all of these policies (e.g. manual recovery after a partial apply) —
-- see plans/006-idempotent-rls-storage-policies.md. `drop ... if exists`
-- is a no-op on a fresh database, so this changes nothing about a normal
-- first-time apply.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is the current authenticated user a member of the given store?
-- Not security definer: it queries store_users, which has its own RLS
-- restricting rows to `user_id = auth.uid()`, so the check below only ever
-- "sees" the caller's own membership rows anyway. No recursion risk because
-- store_users' own policies do not call this function.
-- ----------------------------------------------------------------------------
create or replace function public.is_store_member(target_store_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.store_users su
    where su.store_id = target_store_id
      and su.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- stores
-- ============================================================================
alter table public.stores enable row level security;

drop policy if exists "stores_public_read_active" on public.stores;

create policy "stores_public_read_active"
  on public.stores for select
  to anon, authenticated
  using (active = true);

drop policy if exists "stores_member_read_own" on public.stores;

create policy "stores_member_read_own"
  on public.stores for select
  to authenticated
  using (public.is_store_member(id));

drop policy if exists "stores_member_update_own" on public.stores;

create policy "stores_member_update_own"
  on public.stores for update
  to authenticated
  using (public.is_store_member(id))
  with check (public.is_store_member(id));

-- No public/authenticated INSERT or DELETE policy: store creation/deletion
-- is an operational task performed with the service-role key, not a normal
-- user action in the MVP.

-- ============================================================================
-- store_users
-- ============================================================================
alter table public.store_users enable row level security;

drop policy if exists "store_users_select_own" on public.store_users;

create policy "store_users_select_own"
  on public.store_users for select
  to authenticated
  using (user_id = auth.uid());

-- No public policies and no self-service insert/update/delete: membership
-- management is out of scope for the MVP UI (PRD §7 Store User) and is done
-- with the service-role key (see scripts/seed.ts).

-- ============================================================================
-- teams
-- ============================================================================
alter table public.teams enable row level security;

drop policy if exists "teams_public_read_active" on public.teams;

create policy "teams_public_read_active"
  on public.teams for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.stores s
      where s.id = teams.store_id and s.active = true
    )
  );

drop policy if exists "teams_member_all" on public.teams;

create policy "teams_member_all"
  on public.teams for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- collections
-- ============================================================================
alter table public.collections enable row level security;

drop policy if exists "collections_public_read_active" on public.collections;

create policy "collections_public_read_active"
  on public.collections for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.stores s
      where s.id = collections.store_id and s.active = true
    )
  );

drop policy if exists "collections_member_all" on public.collections;

create policy "collections_member_all"
  on public.collections for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- competitions
-- ============================================================================
alter table public.competitions enable row level security;

drop policy if exists "competitions_public_read_active" on public.competitions;

create policy "competitions_public_read_active"
  on public.competitions for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.stores s
      where s.id = competitions.store_id and s.active = true
    )
  );

drop policy if exists "competitions_member_all" on public.competitions;

create policy "competitions_member_all"
  on public.competitions for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- products
-- Public: only 'active' or 'sold_out'. 'draft' and 'hidden' never public.
-- ============================================================================
alter table public.products enable row level security;

drop policy if exists "products_public_read_published" on public.products;

create policy "products_public_read_published"
  on public.products for select
  to anon, authenticated
  using (
    status in ('active', 'sold_out')
    and exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.active = true
    )
  );

drop policy if exists "products_member_all" on public.products;

create policy "products_member_all"
  on public.products for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- product_sizes
-- ============================================================================
alter table public.product_sizes enable row level security;

drop policy if exists "product_sizes_public_read_published" on public.product_sizes;

create policy "product_sizes_public_read_published"
  on public.product_sizes for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = product_sizes.product_id
        and p.status in ('active', 'sold_out')
        and s.active = true
    )
  );

drop policy if exists "product_sizes_member_all" on public.product_sizes;

create policy "product_sizes_member_all"
  on public.product_sizes for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- product_images
-- ============================================================================
alter table public.product_images enable row level security;

drop policy if exists "product_images_public_read_published" on public.product_images;

create policy "product_images_public_read_published"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = product_images.product_id
        and p.status in ('active', 'sold_out')
        and s.active = true
    )
  );

drop policy if exists "product_images_member_all" on public.product_images;

create policy "product_images_member_all"
  on public.product_images for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- ai_models / ai_model_poses / ai_generations / store_settings
-- Admin-only. No public policy is created, so RLS denies all anon/public
-- access by default once enabled.
-- ============================================================================
alter table public.ai_models enable row level security;

drop policy if exists "ai_models_member_all" on public.ai_models;

create policy "ai_models_member_all"
  on public.ai_models for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

alter table public.ai_model_poses enable row level security;

drop policy if exists "ai_model_poses_member_all" on public.ai_model_poses;

create policy "ai_model_poses_member_all"
  on public.ai_model_poses for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

alter table public.ai_generations enable row level security;

drop policy if exists "ai_generations_member_all" on public.ai_generations;

create policy "ai_generations_member_all"
  on public.ai_generations for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

alter table public.store_settings enable row level security;

drop policy if exists "store_settings_member_all" on public.store_settings;

create policy "store_settings_member_all"
  on public.store_settings for all
  to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

-- ============================================================================
-- analytics_events
-- Admin-only read for now. Public write path is an explicit Phase 8 decision
-- (see migration header comment); no insert policy exists yet for anon.
-- ============================================================================
alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_member_read" on public.analytics_events;

create policy "analytics_events_member_read"
  on public.analytics_events for select
  to authenticated
  using (public.is_store_member(store_id));

drop policy if exists "analytics_events_member_insert" on public.analytics_events;

create policy "analytics_events_member_insert"
  on public.analytics_events for insert
  to authenticated
  with check (public.is_store_member(store_id));
