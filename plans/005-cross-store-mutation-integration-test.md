# Plan 005 — Add the missing "user from another store cannot mutate products" integration test

**Status:** TODO
**Category:** test-coverage
**Depends on:** nothing (independent of plan 002 — see `plans/README.md`
for how they relate; this test exercises RLS directly, plan 002 patches
the Server Action layer)
**Requires:** a real, reachable Supabase project with
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` set and `npm run seed` already run — this test
file already skips itself entirely (not a failure) when those aren't
available, so it's safe to write and commit even before that's true in
your current environment.

## Context — why this matters

`CLAUDE.md`'s "Testing expectations" section names four required
integration tests (the fifth, AI quota, doesn't apply yet — Phase 6 is
unimplemented):

```
### Integration
- draft product is not public
- active product is public
- unauthenticated user cannot mutate products
- user from another store cannot mutate products
```

`src/lib/queries/__tests__/public-visibility.integration.test.ts` already
covers the first three (read the whole file before editing it — it's
short, under 150 lines). It does **not** cover the fourth: there is no
test anywhere that creates two stores, authenticates as a member of one,
and confirms that member cannot mutate the other store's data. This is
precisely the failure mode `CLAUDE.md`'s own "Multi-store-ready
architecture" section is most worried about, and precisely the class of
bug plan 002 in this same `plans/` directory fixes at the Server Action
layer — but plan 002 only protects the specific `team_id`/
`collection_id`/`competition_id` reference check; this test protects the
more fundamental "can Store B's authenticated member touch Store A's
`products` row at all" guarantee, enforced by
`products_member_all`'s RLS policy
(`supabase/migrations/20260825000002_rls_policies.sql:155-159`). They're
complementary, not redundant.

## Current file structure (read this before editing)

`src/lib/queries/__tests__/public-visibility.integration.test.ts` currently:

- Guards the whole suite with `describe.skipIf(!hasCreds || !reachable)`.
- `beforeAll` creates an `admin` client (service-role) and an `anon`
  client (anon key, no session), looks up the seeded store by
  `storeSlug`/`DEFAULT_STORE_SLUG`, grabs one existing seeded team, and
  creates two throwaway products (`draft`, `active`) directly via the
  `admin` client.
- `afterAll` deletes those two products via the `admin` client.
- Three `it` blocks, using only `admin` and `anon` — there is currently no
  client that's authenticated as a real (non-service-role) user.

## Implementation

Add a second store, a second team (products require a `team_id`, and a
team belongs to exactly one store — see
`supabase/migrations/20260825000001_initial_schema.sql:130-165`), and a
throwaway authenticated user who is a member of that second store, all
created and torn down the same way the existing fixtures are (directly via
the `admin` client in `beforeAll`/`afterAll`, no dependency on `npm run
seed` having created them). Then sign in as that user with a real
`supabase-js` client (not the admin client, not the anon-with-no-session
client already in the file) and attempt to mutate Store A's `activeProductId`.

Add these variables alongside the existing ones at the top of the
`describe` block:

```ts
  let admin: SupabaseClient<Database>;
  let anon: SupabaseClient<Database>;
  let storeId: string;
  let teamId: string;
  let draftProductId: string;
  let activeProductId: string;
  // --- new, for the cross-store mutation test ---
  let otherStoreId: string;
  let crossStoreUserId: string;
  let crossStoreClient: SupabaseClient<Database>;
```

Inside `beforeAll`, after the existing `activeProductId` fixture is
created (right before the function ends), add:

```ts
  const crossStoreEmail = `cross-store-test-${suffix}@example.com`;
  const crossStorePassword = `Test-${suffix}-!Aa1`;

  const { data: otherStore, error: otherStoreError } = await admin
    .from("stores")
    .insert({ name: "Test cross-store B", slug: `test-store-b-${suffix}`, active: true })
    .select("id")
    .single();
  if (otherStoreError || !otherStore) {
    throw new Error(`Failed to create second store fixture: ${otherStoreError?.message}`);
  }
  otherStoreId = otherStore.id;

  const { data: otherTeam, error: otherTeamError } = await admin
    .from("teams")
    .insert({
      store_id: otherStoreId,
      name: "Test team B",
      slug: `test-team-b-${suffix}`,
      type: "club",
      active: true,
    })
    .select("id")
    .single();
  if (otherTeamError || !otherTeam) {
    throw new Error(`Failed to create second store's team fixture: ${otherTeamError?.message}`);
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: crossStoreEmail,
    password: crossStorePassword,
    email_confirm: true,
  });
  if (createUserError || !createdUser.user) {
    throw new Error(`Failed to create cross-store test user: ${createUserError?.message}`);
  }
  crossStoreUserId = createdUser.user.id;

  const { error: membershipError } = await admin
    .from("store_users")
    .insert({ store_id: otherStoreId, user_id: crossStoreUserId, role: "owner" });
  if (membershipError) {
    throw new Error(`Failed to create cross-store membership: ${membershipError.message}`);
  }

  crossStoreClient = createSupabaseClient<Database>(url as string, anonKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await crossStoreClient.auth.signInWithPassword({
    email: crossStoreEmail,
    password: crossStorePassword,
  });
  if (signInError) {
    throw new Error(`Failed to sign in as cross-store test user: ${signInError.message}`);
  }
```

(`suffix` already exists earlier in `beforeAll` — reuse it rather than
declaring a second timestamp, so all fixtures from one test run share the
same identifiable suffix.)

Update `afterAll` to clean these up too — order matters, delete the store
last since `teams`/`store_users` both have `on delete cascade` on
`store_id` per the schema, so deleting `otherStoreId` cleans up the team
and membership row automatically, but the auth user is not a child of
`stores` and needs its own delete:

```ts
  afterAll(async () => {
    const ids = [draftProductId, activeProductId].filter(Boolean);
    if (ids.length > 0) {
      await admin.from("products").delete().in("id", ids);
    }
    if (otherStoreId) {
      await admin.from("stores").delete().eq("id", otherStoreId);
    }
    if (crossStoreUserId) {
      await admin.auth.admin.deleteUser(crossStoreUserId);
    }
  });
```

Add the new test, following the existing "rejects an anonymous mutation
attempt" test's pattern of asserting on the *effect* rather than assuming
an `error` is set (RLS denies by matching zero rows, not by raising a hard
error):

```ts
  it("rejects a mutation attempt from an authenticated user of another store", async () => {
    await crossStoreClient
      .from("products")
      .update({ name: "hacked-cross-store" })
      .eq("id", activeProductId);
    const { data: check } = await admin
      .from("products")
      .select("name")
      .eq("id", activeProductId)
      .single();
    expect(check?.name).not.toBe("hacked-cross-store");
  });
```

Place it after the existing "rejects an anonymous mutation attempt" test,
so the file reads as: draft-hidden → active-visible →
anon-cannot-mutate → cross-store-cannot-mutate (auth escalates from
"no session" to "wrong store's session" across the last two tests, which
is a natural reading order).

## Explicitly out of scope

- Do not add a similar test for `teams`/`collections`/`competitions`
  mutation by a cross-store user — `products_member_all`'s pattern is
  representative of every `*_member_all` policy in
  `20260825000002_rls_policies.sql` (they're all
  `is_store_member(store_id)`), so one confirmed example is enough
  coverage for this finding; don't multiply near-identical test cases
  across every table as part of this plan.
- Do not add a test exercising plan 002's `verifyReferencesOwnedByStore`
  Server Action check — that requires calling the Server Action itself
  (not just raw Supabase RLS), which this file's live-Supabase-client
  pattern isn't set up to do (Server Actions expect the Next.js server
  request context). Note it as a maintenance follow-up instead (see
  below) rather than building new test infrastructure here.

## Verification

```bash
npm run typecheck
npm run lint
```

`npm run test` will run this file, but the new (and existing) `describe`
block only actually executes if real Supabase credentials are present in
the environment — confirm via the test output whether it ran or was
skipped (`describe.skipIf` prints as skipped, not failed, when creds are
absent). If you have access to a real/local Supabase project with these
migrations applied, set the three env vars and `DEFAULT_STORE_SLUG`, run
`npm run seed`, then run `npm run test` and confirm all four `it` blocks
in this file pass (not skip).

## Done criteria

- The new fixtures (second store, second team, test user, membership) are
  created in `beforeAll` and torn down in `afterAll`.
- The new `it` block exists and asserts the cross-store update did not
  take effect.
- `npm run typecheck && npm run lint` pass.
- When run against a real Supabase project, all four `it` blocks in this
  file pass.

## Maintenance note

If plan 002 (Server Action-level reference ownership check) lands and you
want direct regression coverage for it specifically (rather than relying
on this RLS-level test as a proxy), that would need a different kind of
test — one that can invoke the Server Action functions directly with a
mocked or real request context, which this codebase doesn't have a
pattern for yet. That's the same "Server Actions have no test coverage"
gap noted in `plans/README.md`'s "other findings" list — worth solving
once, generally, rather than building one-off infrastructure just for
this case.
