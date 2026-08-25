# Plan 002 — Verify `team_id`/`collection_id`/`competition_id` belong to the caller's store

**Status:** TODO
**Category:** correctness / security (tenant isolation)
**Commit this plan was written against:** working tree as of 2026-08-25
(see `plans/README.md` — the real repo's only commit, `206a070`, predates
this code; verify by opening the file at the path below and confirming it
still contains the comment quoted in "Current state").

## Context — why this matters

This project (`CLAUDE.md` root file, section "Multi-store-ready
architecture") is built multi-tenant from day one: every business table
carries a `store_id`, and the core security invariant, stated explicitly
in `CLAUDE.md`'s "Security" section, is:

> Never trust a `store_id` supplied by the browser without authorization
> checks.

`src/lib/actions/products.ts` correctly applies this for the *product
row itself* — every mutation calls `requireStoreMembership()` and scopes
its query with `.eq("store_id", store.id)`. But a product also carries
three **foreign references** to other tenant-owned tables — `team_id`
(required) and `collection_id`/`competition_id` (optional) — and nothing
currently checks that those referenced rows belong to the same store.

### Current state (read this file before making any change)

`src/lib/actions/products.ts`, `createProduct` (lines 11-38):

```ts
export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Dados inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { store } = await requireStoreMembership();
  const supabase = await createClient();

  // team_id (and, if set, collection_id/competition_id) must belong to this
  // store — the FK alone doesn't check tenant ownership. RLS on `teams` /
  // `collections` / `competitions` already prevents reading another
  // store's row here, so a cross-store id simply won't be found.
  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, store_id: store.id })
    .select("id")
    .single();
  ...
```

and `updateProduct` (lines 40-64) has the identical gap — it validates
`parsed.data` and writes it straight through with no reference check at
all (not even the comment `createProduct` has).

**The comment's own reasoning is wrong**, and that's the actual bug: it
assumes reading `teams`/`collections`/`competitions` through RLS is what
protects this insert, but nothing here *reads* those tables at all — the
`products.insert(...)` call relies purely on the database's foreign-key
constraints to validate `team_id`/`collection_id`/`competition_id` exist.
PostgreSQL foreign-key constraint checks are implemented as internal
system triggers that **run with elevated privileges and bypass Row Level
Security on the referenced table** — this is documented core Postgres
behavior (Postgres manual, "Row Security Policies": referential-integrity
checks always bypass row security), not a bug in this codebase's
migrations. `products_member_all` (see
`supabase/migrations/20260825000002_rls_policies.sql:155-159`) only checks
`is_store_member(products.store_id)` — it has no way to know or care which
store a *referenced* team/collection/competition belongs to.

Concretely: team IDs for any active store are publicly enumerable (the
`teams_public_read_active` policy lets anyone read them), so an
authenticated member of Store A can call `createProduct`/`updateProduct`
with a `team_id` that belongs to Store B, and the insert/update succeeds —
cross-linking Store A's product to Store B's team. The same applies to
`collection_id`/`competition_id`.

Compare with the pattern this codebase already uses elsewhere for exactly
this kind of check — `src/lib/actions/product-images.ts:23-35`:

```ts
async function isOwnedProduct(
  supabase: SupabaseServerClient,
  productId: string,
  storeId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  return Boolean(data);
}
```

This plan applies that same explicit-lookup pattern to `team_id`,
`collection_id`, and `competition_id` inside `products.ts`.

## Implementation

Add a local helper to `src/lib/actions/products.ts` (same file, following
the existing convention of `product-images.ts` keeping `isOwnedProduct`
local rather than shared — see the "Duplicated ownership-check
boilerplate" note in `plans/README.md`'s "other findings" list for why
unifying them is explicitly out of scope here):

```ts
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Verifies that team_id (required) and, if present, collection_id /
 * competition_id all belong to `storeId`. Necessary because Postgres
 * foreign-key checks run with elevated privileges and bypass RLS on the
 * referenced table (see this plan's write-up in plans/002-*.md for why the
 * previous comment here was incorrect) — `products_member_all` RLS only
 * protects the `products` row itself, not what it points at.
 */
async function verifyReferencesOwnedByStore(
  supabase: SupabaseServerClient,
  storeId: string,
  refs: { team_id?: string; collection_id?: string | null; competition_id?: string | null },
): Promise<string | null> {
  if (refs.team_id) {
    const { data } = await supabase
      .from("teams")
      .select("id")
      .eq("id", refs.team_id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) return "Time inválido.";
  }
  if (refs.collection_id) {
    const { data } = await supabase
      .from("collections")
      .select("id")
      .eq("id", refs.collection_id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) return "Coleção inválida.";
  }
  if (refs.competition_id) {
    const { data } = await supabase
      .from("competitions")
      .select("id")
      .eq("id", refs.competition_id)
      .eq("store_id", storeId)
      .maybeSingle();
    if (!data) return "Competição inválida.";
  }
  return null;
}
```

Then call it in both actions, right after `requireStoreMembership()` and
before the insert/update, returning the same `actionError(...)` shape
every other validation failure in this file already uses:

In `createProduct`, after `const supabase = await createClient();` and
before the `products.insert(...)` call:

```ts
  const referenceError = await verifyReferencesOwnedByStore(supabase, store.id, {
    team_id: parsed.data.team_id,
    collection_id: parsed.data.collection_id,
    competition_id: parsed.data.competition_id,
  });
  if (referenceError) return actionError(referenceError);
```

In `updateProduct`, same placement, before the `products.update(...)`
call — but remember `parsed.data` comes from `productInputSchema.partial()`,
so any of the three fields may be `undefined` (not present in this
request) rather than explicitly `null`. Pass them through as-is; the
helper already treats `undefined`/`falsy` as "nothing to check" and only
validates fields that are actually present in this particular update:

```ts
  const referenceError = await verifyReferencesOwnedByStore(supabase, store.id, {
    team_id: parsed.data.team_id,
    collection_id: parsed.data.collection_id,
    competition_id: parsed.data.competition_id,
  });
  if (referenceError) return actionError(referenceError);
```

Also update the now-incorrect comment above `createProduct`'s insert —
replace the "RLS on teams/collections/competitions already prevents..."
comment with something like "See verifyReferencesOwnedByStore above —
FK constraints alone don't check tenant ownership because they bypass RLS
on the referenced table."

## Explicitly out of scope

- Do not touch `duplicateProduct` — it copies `team_id`/`collection_id`/
  `competition_id` from an existing row that's already been fetched with
  `.eq("store_id", store.id)` (line 101), so those references were already
  verified owned by this store when the source product itself was created
  or last updated (assuming this plan has landed by then).
- Do not attempt to add a database-level fix (e.g. a trigger or composite
  FK) — the PRD/ARCHITECTURE docs describe RLS + application checks as the
  authorization model for this project; introducing new trigger-based
  enforcement would be a bigger architectural change than this finding
  warrants and isn't what was asked for.
- Do not unify this with `product-images.ts`'s `isOwnedProduct` into a
  shared helper — that's a separate, lower-priority tech-debt item (see
  `plans/README.md`).
- Do not add a general-purpose Server Action test harness/mocking setup as
  part of this plan — see "Test plan" below for why, and `plans/README.md`
  for the separate, larger finding about Server Action test coverage.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

All four must pass with no new errors. There's no existing test file for
`src/lib/actions/products.ts` (Server Actions in this codebase have no
test coverage yet at all — see `plans/README.md`'s "other findings" list),
so `npm run test` passing is a non-regression check, not new-behavior
coverage for this specific fix.

### Manual verification (since automated coverage isn't cheaply available)

Against a real Supabase project with two stores (or via `npm run seed` run
twice with two different `DEFAULT_STORE_SLUG` values, if you want to set
this up locally):

1. As a member of Store A, call `createProduct` with a `team_id` that
   belongs to Store B. Expect `{ ok: false, error: "Time inválido." }`
   instead of the product being created.
2. Same for `collection_id`/`competition_id`.
3. As a member of Store A, call `createProduct`/`updateProduct` with
   Store A's own `team_id`/`collection_id`/`competition_id`. Expect
   success, unchanged from current behavior.
4. Call `updateProduct` with a partial payload that omits `team_id`
   entirely (only updating, say, `price`). Expect the reference check to
   skip `team_id` and succeed, unchanged from current behavior — this
   guards against a naive fix that assumes `team_id` is always present in
   `parsed.data`.

## Done criteria

- `verifyReferencesOwnedByStore` exists in `src/lib/actions/products.ts`
  and is called from both `createProduct` and `updateProduct` before the
  respective database write.
- The misleading comment above `createProduct`'s insert is corrected.
- `npm run typecheck && npm run lint && npm run test && npm run build`
  all pass.
- The four manual verification scenarios above behave as described (do
  this even if you can't run it yourself — leave it as an explicit
  follow-up note for whoever can).

## Maintenance note

If `product-images.ts`'s `isOwnedProduct` and this plan's
`verifyReferencesOwnedByStore` ever both need a third caller, that's the
signal to extract a shared `src/lib/auth/ownership.ts` (or similar) rather
than a third copy-paste — don't do that extraction preemptively as part of
this plan, since it's speculative until there's a second real duplication
site beyond the one that already exists.

When Phase 6 (AI Foundation) adds `ai_models`/`ai_model_poses` references
to other tables, revisit whether those need the same kind of check — this
plan doesn't touch Phase 6 code (it doesn't exist yet), but the same class
of bug (FK bypasses RLS on the referenced table) applies generally to any
future foreign key between two tenant-owned tables in this codebase.
