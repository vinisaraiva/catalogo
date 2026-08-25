import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Integration test against a REAL Supabase project (TASKS.md Phase 3
 * Validation: "Integration test public visibility"; also exercises
 * CLAUDE.md's "draft product is not public" / "active product is public" /
 * "unauthenticated user cannot mutate products" / "user from another store
 * cannot mutate products" testing expectations).
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
 * SUPABASE_SERVICE_ROLE_KEY (from .env.local) and a store already created
 * by `npm run seed` at DEFAULT_STORE_SLUG. Skips entirely — not a failure
 * — when credentials are missing or the project is unreachable, since
 * sandboxed/CI environments without real Supabase network access can't
 * run this (see DECISIONS.md ADR-025).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storeSlug = process.env.DEFAULT_STORE_SLUG || "loja-dev";

const hasCreds = Boolean(url && anonKey && serviceKey);

let reachable = false;
if (hasCreds) {
  try {
    const res = await fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(3000) });
    reachable = res.ok;
  } catch {
    reachable = false;
  }
}

describe.skipIf(!hasCreds || !reachable)("public visibility (live Supabase)", () => {
  // Client construction happens inside beforeAll, not here in the describe
  // body: vitest's `skipIf` still evaluates the describe body eagerly to
  // collect the test tree (it only skips running the tests/hooks), so
  // constructing clients here would throw on missing `url` even when the
  // whole suite is meant to be skipped.
  let admin: SupabaseClient<Database>;
  let anon: SupabaseClient<Database>;
  let storeId: string;
  let teamId: string;
  let draftProductId: string;
  let activeProductId: string;
  // --- cross-store mutation test fixtures ---
  let otherStoreId: string;
  let crossStoreUserId: string;
  let crossStoreClient: SupabaseClient<Database>;

  beforeAll(async () => {
    admin = createSupabaseClient<Database>(url as string, serviceKey as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    anon = createSupabaseClient<Database>(url as string, anonKey as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single();
    if (storeError || !store) {
      throw new Error(`Seed store "${storeSlug}" not found — run \`npm run seed\` first.`);
    }
    storeId = store.id;

    const { data: team, error: teamError } = await admin
      .from("teams")
      .select("id")
      .eq("store_id", storeId)
      .limit(1)
      .single();
    if (teamError || !team) {
      throw new Error("No seeded team found — run `npm run seed` first.");
    }
    teamId = team.id;

    const suffix = Date.now();

    const { data: draft, error: draftError } = await admin
      .from("products")
      .insert({
        store_id: storeId,
        team_id: teamId,
        name: `[test] draft ${suffix}`,
        slug: `test-draft-${suffix}`,
        status: "draft",
      })
      .select("id")
      .single();
    if (draftError || !draft)
      throw new Error(`Failed to create draft fixture: ${draftError?.message}`);
    draftProductId = draft.id;

    const { data: active, error: activeError } = await admin
      .from("products")
      .insert({
        store_id: storeId,
        team_id: teamId,
        name: `[test] active ${suffix}`,
        slug: `test-active-${suffix}`,
        status: "active",
      })
      .select("id")
      .single();
    if (activeError || !active)
      throw new Error(`Failed to create active fixture: ${activeError?.message}`);
    activeProductId = active.id;

    // --- cross-store mutation test fixtures: a second store, a team for
    // it (products require team_id), and an authenticated member of that
    // second store — used to prove a Store B member can't mutate Store
    // A's product (see the "rejects a mutation attempt from an
    // authenticated user of another store" test below). ---
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
  });

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

  it("hides a draft product from an anonymous reader", async () => {
    const { data } = await anon
      .from("products")
      .select("id")
      .eq("id", draftProductId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("shows an active product to an anonymous reader", async () => {
    const { data } = await anon
      .from("products")
      .select("id")
      .eq("id", activeProductId)
      .maybeSingle();
    expect(data?.id).toBe(activeProductId);
  });

  it("rejects an anonymous mutation attempt", async () => {
    // RLS denies the update by simply matching zero rows under the anon
    // policy rather than raising a hard error, so assert on the *effect*
    // (name unchanged) instead of assuming `error` is set.
    await anon.from("products").update({ name: "hacked" }).eq("id", activeProductId);
    const { data: check } = await admin
      .from("products")
      .select("name")
      .eq("id", activeProductId)
      .single();
    expect(check?.name).not.toBe("hacked");
  });

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
});
