-- ============================================================================
-- Initial schema — Catálogo Inteligente de Camisas Esportivas
-- Phase 1 (Foundation) per TASKS.md / ARCHITECTURE.md §6-§7 / PRD.md §5-§11.
--
-- Multi-store-ready from day one (ADR-005): every tenant-owned table carries
-- store_id even though the MVP runs a single store.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- stores
-- ----------------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  whatsapp_number text,
  instagram_url text,
  currency text not null default 'BRL',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- store_users — links an authenticated user to a store with a role.
-- ----------------------------------------------------------------------------
create table public.store_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index store_users_user_id_idx on public.store_users (user_id);
create index store_users_store_id_idx on public.store_users (store_id);

-- ----------------------------------------------------------------------------
-- teams — first-class entity (ADR-006). Not a category tree.
-- ----------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  type text not null check (type in ('club', 'national_team')),
  country text,
  logo_url text,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index teams_store_id_idx on public.teams (store_id);
create index teams_store_active_idx on public.teams (store_id, active);

create trigger set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- collections — reusable vocabulary (Atual, Retrô, Especial, Treino, ...)
-- ----------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index collections_store_id_idx on public.collections (store_id);

create trigger set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- competitions (Libertadores, Champions League, Copa do Mundo, ...)
-- ----------------------------------------------------------------------------
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index competitions_store_id_idx on public.competitions (store_id);

create trigger set_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete restrict,
  collection_id uuid references public.collections (id) on delete set null,
  competition_id uuid references public.competitions (id) on delete set null,
  name text not null,
  slug text not null,
  season text,
  model text,
  product_type text,
  description text,
  price numeric(10, 2) check (price is null or price >= 0),
  promotional_price numeric(10, 2) check (promotional_price is null or promotional_price >= 0),
  price_display_mode text not null default 'show_price'
    check (price_display_mode in ('show_price', 'consult', 'hidden')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'sold_out', 'hidden')),
  featured boolean not null default false,
  new_arrival boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index products_store_id_idx on public.products (store_id);
create index products_store_status_idx on public.products (store_id, status);
create index products_store_team_idx on public.products (store_id, team_id);
create index products_collection_idx on public.products (collection_id);
create index products_competition_idx on public.products (competition_id);

create trigger set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- product_sizes
-- store_id is denormalized from products for simpler/faster RLS policies.
-- ----------------------------------------------------------------------------
create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  quantity integer check (quantity is null or quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size)
);

create index product_sizes_product_id_idx on public.product_sizes (product_id);
create index product_sizes_store_id_idx on public.product_sizes (store_id);

create trigger set_updated_at
  before update on public.product_sizes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- product_images
-- store_id is denormalized from products for simpler/faster RLS policies.
-- ----------------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  image_type text not null
    check (image_type in ('original', 'generated', 'social_feed', 'social_story', 'detail')),
  url text not null,
  sort_order integer not null default 0,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);
create index product_images_store_id_idx on public.product_images (store_id);

-- ----------------------------------------------------------------------------
-- ai_models
-- ----------------------------------------------------------------------------
create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_models_store_id_idx on public.ai_models (store_id);

create trigger set_updated_at
  before update on public.ai_models
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ai_model_poses
-- ----------------------------------------------------------------------------
create table public.ai_model_poses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  ai_model_id uuid not null references public.ai_models (id) on delete cascade,
  name text not null,
  reference_image_url text,
  active boolean not null default true,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_model_poses_store_id_idx on public.ai_model_poses (store_id);
create index ai_model_poses_ai_model_id_idx on public.ai_model_poses (ai_model_id);

create trigger set_updated_at
  before update on public.ai_model_poses
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ai_generations — source of truth for daily quota accounting (ADR-015).
-- ----------------------------------------------------------------------------
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  provider text not null,
  model text not null,
  generation_type text not null default 'try_on'
    check (generation_type in ('try_on')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'approved', 'discarded')),
  cost_estimate numeric(10, 4),
  created_at timestamptz not null default now()
);

create index ai_generations_store_created_idx on public.ai_generations (store_id, created_at);
create index ai_generations_product_id_idx on public.ai_generations (product_id);

-- ----------------------------------------------------------------------------
-- store_settings — one row per store. daily_ai_generation_limit is the
-- authoritative quota value (ADR-015); .env value is a dev-only fallback.
-- ----------------------------------------------------------------------------
create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores (id) on delete cascade,
  daily_ai_generation_limit integer not null default 10 check (daily_ai_generation_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- analytics_events — minimal MVP analytics (PRD §30 / ARCHITECTURE §21).
-- Write path (who is allowed to insert) is decided in Phase 8; RLS below
-- only grants store-member read access for now.
-- ----------------------------------------------------------------------------
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  event_type text not null
    check (event_type in ('catalog_view', 'product_view', 'whatsapp_click', 'selection_add')),
  product_id uuid references public.products (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_store_type_created_idx
  on public.analytics_events (store_id, event_type, created_at);
