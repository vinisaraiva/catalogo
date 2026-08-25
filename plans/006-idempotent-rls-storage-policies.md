# Plan 006 — Make RLS/Storage policy migrations idempotent

**Status:** TODO
**Category:** dx-tooling

## Context — why this matters

`CLAUDE.md`'s "Database standards" section requires: "Use versioned
migrations. Do not rely on manual production schema edits." Two of this
project's three migrations create Postgres RLS policies with bare
`create policy ...` statements and no `drop policy if exists` guard
beforehand:

- `supabase/migrations/20260825000002_rls_policies.sql` — 22
  `create policy` statements across `stores`, `store_users`, `teams`,
  `collections`, `competitions`, `products`, `product_sizes`,
  `product_images`, `ai_models`, `ai_model_poses`, `ai_generations`,
  `store_settings`, and `analytics_events`.
- `supabase/migrations/20260825000003_product_images_storage.sql` — 3 more,
  on `storage.objects`.

`CREATE POLICY` has no `IF NOT EXISTS` form in Postgres, so re-running
either file against a database that already has some or all of these
policies (a manual recovery attempt after a partial failure, or hand-running
the file outside the normal `supabase db push`/`db reset` flow) fails
outright with a "policy already exists" error. Notably, the same file
(`20260825000003`, line 19-34) already uses the equivalent idempotency
idiom for its bucket insert — `insert into storage.buckets (...) ... on
conflict (id) do nothing` — so this isn't introducing an unfamiliar
pattern to the codebase, just applying the same care consistently to the
policy statements that don't currently have it.

## Important: how to do this without touching already-applied migration history

Both of these migration files may already have been applied to the real
Supabase project (`npm run db:migrate` / `supabase db push`, or run
manually — the project was recently provisioned this session). **Do not
assume they haven't been.** Before making any change, check with the user
or, if you have Supabase MCP tool access, use `list_migrations` /
`get_advisors` to see what's actually been applied to the live project.

Given the situation as understood at the time this plan was written — this
project is still pre-launch, single-developer, single-environment, with no
CI and (as of `plans/001-urgent-secrets-and-vcs-hygiene.md`) barely any git
history yet — editing these two files in place to add
`drop policy if exists "<name>" on <table>;` immediately before each
existing `create policy` is safe *in this specific situation*, because:

- `DROP POLICY IF EXISTS` is a no-op when the policy doesn't exist yet, so
  a fresh `supabase db reset` (or a first-time apply against any new
  environment) behaves identically to today — nothing about the resulting
  schema changes.
- Standard migration tooling (including `supabase db push`) tracks
  *which migration files/versions* have already been applied by name/
  version, not a hash of their content — editing an already-applied file's
  text doesn't cause it to silently re-run against a database that already
  has it recorded as applied.
- There is (as far as this plan's author could determine) exactly one
  environment and one Supabase project for this entire codebase right now
  — no staging, no second developer's local Supabase instance, no CI that
  might apply these files independently.

**If any of those assumptions turn out to be false** — a second
environment, another developer, a CI pipeline that applies migrations
already exists or gets added before this plan is executed — STOP and use
a new migration file instead (a `20260825000004_idempotent_policies.sql`
that does `drop policy if exists ...; create policy ...;` for all 25
policies, listed under "Implementation" below) rather than editing
`20260825000002`/`20260825000003` in place, and flag the change of
approach to the user rather than silently deciding.

## Implementation (default: edit in place)

For every `create policy "<name>" on <table> for ...` statement in both
files, insert a `drop policy if exists "<name>" on <table>;` line
immediately before it. The full list of policies to guard, extracted
directly from the two files (name — table):

From `20260825000002_rls_policies.sql`:

```
stores_public_read_active            — public.stores
stores_member_read_own               — public.stores
stores_member_update_own             — public.stores
store_users_select_own               — public.store_users
teams_public_read_active             — public.teams
teams_member_all                     — public.teams
collections_public_read_active       — public.collections
collections_member_all               — public.collections
competitions_public_read_active      — public.competitions
competitions_member_all              — public.competitions
products_public_read_published       — public.products
products_member_all                  — public.products
product_sizes_public_read_published  — public.product_sizes
product_sizes_member_all             — public.product_sizes
product_images_public_read_published — public.product_images
product_images_member_all            — public.product_images
ai_models_member_all                 — public.ai_models
ai_model_poses_member_all            — public.ai_model_poses
ai_generations_member_all            — public.ai_generations
store_settings_member_all            — public.store_settings
analytics_events_member_read         — public.analytics_events
analytics_events_member_insert       — public.analytics_events
```

From `20260825000003_product_images_storage.sql`:

```
product_images_storage_insert_own_store — storage.objects
product_images_storage_update_own_store — storage.objects
product_images_storage_delete_own_store — storage.objects
```

Example of the transform (apply the identical pattern to all 25 — this is
mechanical, not something requiring per-policy judgment):

Before:

```sql
create policy "stores_public_read_active"
  on public.stores for select
  to anon, authenticated
  using (active = true);
```

After:

```sql
drop policy if exists "stores_public_read_active" on public.stores;

create policy "stores_public_read_active"
  on public.stores for select
  to anon, authenticated
  using (active = true);
```

Apply this same two-line insertion (blank line optional, match the file's
existing spacing style) before all 22 policies in
`20260825000002_rls_policies.sql` and all 3 in
`20260825000003_product_images_storage.sql`. Leave every other line
(comments, the `is_store_member` function, the `storage.buckets` insert,
section header comments) untouched.

## Implementation (fallback: new migration file, only if the escape hatch above applies)

If editing in place turns out to be unsafe per the "STOP" condition above,
instead create `supabase/migrations/20260825000004_idempotent_policies.sql`
containing, for each of the 25 policies listed above, a
`drop policy if exists "<name>" on <table>;` statement followed by the
exact `create policy ...` body copied unchanged from wherever it currently
lives (`20260825000002` or `20260825000003`) — i.e. the same per-policy
pairing shown in the "Example of the transform" above, just collected into
one new file instead of edited in place in the old ones. Leave
`20260825000002`/`20260825000003` completely untouched in this fallback
path.

## Explicitly out of scope

- Do not add `if not exists` to `create table` statements in
  `20260825000001_initial_schema.sql`, or otherwise try to make the whole
  migration history idempotent — this plan is scoped to the specific
  "policy already exists" failure mode identified in the audit, not a
  general idempotency pass over every migration.
- Do not change any policy's actual logic (`using`/`with check` clauses,
  roles, or table) — this plan only wraps existing policies with a guard,
  it doesn't touch what they do.

## Verification

There is no local Postgres instance assumed to be available, so this
can't be verified with `npm run test`. Instead:

```bash
npm run lint
```

(SQL files aren't linted by ESLint, but this confirms the change didn't
accidentally break anything else in a commit that touches multiple files.)

If you have Supabase CLI access to a disposable/local database (`supabase
start` + `supabase db reset`), the real verification is: run
`supabase db reset` twice in a row and confirm the second run succeeds
without a "policy already exists" error — that's the exact failure mode
this plan fixes, and the cheapest way to prove it's fixed.

## Done criteria

- Every one of the 25 policies listed above is preceded by a matching
  `drop policy if exists "<name>" on <table>;` statement, in whichever of
  the two file locations (in-place edit vs. new migration) was
  appropriate per the decision above.
- No policy's `using`/`with check`/role/table logic changed.
- `supabase db reset` (if available) succeeds twice in a row.

## Maintenance note

Going forward, any new migration in this project that creates an RLS or
Storage policy should include the `drop policy if exists` guard from the
start, following the pattern established here (and already established by
the bucket insert's `on conflict do nothing`) — worth a one-line mention
in `CLAUDE.md`'s "Database standards" section if you want this to stick
as a convention rather than something a future contributor has to
rediscover from reading this plan.
