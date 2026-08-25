/**
 * Development seed script (TASKS.md Phase 1 / Seed).
 *
 * Creates: a dev store, an owner membership, sample teams, collections,
 * competitions and products. Idempotent — safe to re-run (upserts by
 * unique slug / email).
 *
 * Requires a real Supabase project. Reads SUPABASE_SERVICE_ROLE_KEY, so it
 * must only ever be run locally/CI, never shipped or exposed to a browser.
 *
 * Usage: npm run seed
 */
import { createAdminClient } from "../src/lib/supabase/admin";

const STORE_SLUG = process.env.DEFAULT_STORE_SLUG || "loja-dev";
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL;
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD;

async function main() {
  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error(
      "SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD must be set (dev-only env vars, see .env.example) " +
        "so the seed script knows which admin account to grant store ownership to.",
    );
  }

  const supabase = createAdminClient();

  // ---- store ---------------------------------------------------------
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .upsert(
      {
        name: "Loja de Desenvolvimento",
        slug: STORE_SLUG,
        currency: "BRL",
        active: true,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();

  if (storeError || !store) {
    throw new Error(`Failed to upsert dev store: ${storeError?.message}`);
  }
  console.log(`✓ store: ${store.slug} (${store.id})`);

  // ---- store_settings --------------------------------------------------
  const { error: settingsError } = await supabase.from("store_settings").upsert(
    {
      store_id: store.id,
      daily_ai_generation_limit: Number(process.env.DEFAULT_DAILY_AI_GENERATION_LIMIT) || 10,
    },
    { onConflict: "store_id" },
  );
  if (settingsError) {
    throw new Error(`Failed to upsert store_settings: ${settingsError.message}`);
  }
  console.log("✓ store_settings");

  // ---- owner user + membership -----------------------------------------
  const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
  if (listUsersError) {
    throw new Error(`Failed to list auth users: ${listUsersError.message}`);
  }

  let ownerId = existingUsers.users.find((u) => u.email === OWNER_EMAIL)?.id;

  if (!ownerId) {
    const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      email_confirm: true,
    });
    if (createUserError || !created.user) {
      throw new Error(`Failed to create owner user: ${createUserError?.message}`);
    }
    ownerId = created.user.id;
    console.log(`✓ auth user created: ${OWNER_EMAIL}`);
  } else {
    console.log(`✓ auth user already exists: ${OWNER_EMAIL}`);
  }

  const { error: membershipError } = await supabase
    .from("store_users")
    .upsert(
      { store_id: store.id, user_id: ownerId, role: "owner" },
      { onConflict: "store_id,user_id" },
    );
  if (membershipError) {
    throw new Error(`Failed to upsert owner membership: ${membershipError.message}`);
  }
  console.log("✓ owner membership");

  // ---- sample teams ------------------------------------------------------
  const teams = [
    { name: "Flamengo", slug: "flamengo", type: "club" as const, country: "Brasil" },
    { name: "Palmeiras", slug: "palmeiras", type: "club" as const, country: "Brasil" },
    { name: "Brasil", slug: "brasil", type: "national_team" as const, country: "Brasil" },
  ];
  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .upsert(
      teams.map((t) => ({ ...t, store_id: store.id, active: true })),
      { onConflict: "store_id,slug" },
    )
    .select();
  if (teamsError || !teamRows) {
    throw new Error(`Failed to upsert teams: ${teamsError?.message}`);
  }
  console.log(`✓ teams: ${teamRows.map((t) => t.slug).join(", ")}`);

  // ---- sample collections -------------------------------------------------
  const collections = [
    { name: "Atual", slug: "atual" },
    { name: "Retrô", slug: "retro" },
  ];
  const { data: collectionRows, error: collectionsError } = await supabase
    .from("collections")
    .upsert(
      collections.map((c) => ({ ...c, store_id: store.id, active: true })),
      { onConflict: "store_id,slug" },
    )
    .select();
  if (collectionsError || !collectionRows) {
    throw new Error(`Failed to upsert collections: ${collectionsError?.message}`);
  }
  console.log(`✓ collections: ${collectionRows.map((c) => c.slug).join(", ")}`);

  // ---- sample competitions ------------------------------------------------
  const competitions = [
    { name: "Libertadores", slug: "libertadores" },
    { name: "Brasileirão", slug: "brasileirao" },
  ];
  const { data: competitionRows, error: competitionsError } = await supabase
    .from("competitions")
    .upsert(
      competitions.map((c) => ({ ...c, store_id: store.id, active: true })),
      { onConflict: "store_id,slug" },
    )
    .select();
  if (competitionsError || !competitionRows) {
    throw new Error(`Failed to upsert competitions: ${competitionsError?.message}`);
  }
  console.log(`✓ competitions: ${competitionRows.map((c) => c.slug).join(", ")}`);

  // ---- sample products -----------------------------------------------------
  const flamengo = teamRows.find((t) => t.slug === "flamengo")!;
  const retro = collectionRows.find((c) => c.slug === "retro")!;
  const libertadores = competitionRows.find((c) => c.slug === "libertadores")!;

  const { error: productsError } = await supabase.from("products").upsert(
    [
      {
        store_id: store.id,
        team_id: flamengo.id,
        collection_id: retro.id,
        competition_id: libertadores.id,
        name: "Camisa Flamengo Retrô 1981",
        slug: "camisa-flamengo-retro-1981",
        season: "1981",
        model: "Home",
        product_type: "Torcedor",
        price: 149.9,
        price_display_mode: "show_price",
        status: "active",
      },
    ],
    { onConflict: "store_id,slug" },
  );
  if (productsError) {
    throw new Error(`Failed to upsert sample product: ${productsError.message}`);
  }
  console.log("✓ sample product");

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
