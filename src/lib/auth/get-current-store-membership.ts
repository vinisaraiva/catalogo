import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type StoreUserRow = Database["public"]["Tables"]["store_users"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

export type StoreMembership =
  | { status: "unauthenticated" }
  | { status: "no_store"; user: User }
  | { status: "ok"; user: User; storeUser: StoreUserRow; store: StoreRow };

/**
 * Resolves the authenticated user's store membership, server-side.
 *
 * The MVP UI assumes a single store per user (PRD §4.1), so this returns
 * the first membership found. The data model still supports more than one
 * (`store_users` has no uniqueness constraint across stores), which keeps
 * the door open for multi-store without a migration.
 *
 * Handles the "authenticated but not a member of any store" case
 * explicitly (TASKS.md Phase 1 / Auth: "Handle unauthorized/no-store
 * state") instead of letting it surface as an empty/broken admin screen.
 */
export async function getCurrentStoreMembership(): Promise<StoreMembership> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: storeUser, error } = await supabase
    .from("store_users")
    .select("*, stores(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve store membership: ${error.message}`);
  }

  if (!storeUser) {
    return { status: "no_store", user };
  }

  const { stores: store, ...storeUserRow } = storeUser as StoreUserRow & {
    stores: StoreRow;
  };

  return { status: "ok", user, storeUser: storeUserRow, store };
}
