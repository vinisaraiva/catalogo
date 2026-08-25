import "server-only";
import { getCurrentStoreMembership, type StoreMembership } from "./get-current-store-membership";

export class UnauthorizedError extends Error {
  constructor(message = "Não autenticado ou sem loja associada.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Server Action / Route Handler guard: resolves the current user's store
 * membership or throws. Every mutation MUST call this and use the
 * resulting `store.id` — never a store_id supplied by the client
 * (CLAUDE.md "Security": "Never trust a store_id supplied by the browser
 * without authorization checks").
 *
 * This is an application-level check in addition to, not instead of, RLS:
 * mutations still go through the RLS-scoped server client
 * (lib/supabase/server.ts), so a bug here does not by itself grant
 * cross-store access.
 */
export async function requireStoreMembership(): Promise<
  Extract<StoreMembership, { status: "ok" }>
> {
  const membership = await getCurrentStoreMembership();
  if (membership.status !== "ok") {
    throw new UnauthorizedError();
  }
  return membership;
}
