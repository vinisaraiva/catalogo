# Plan 003 — Escape user input before splicing it into PostgREST `.or()` filters

**Status:** TODO
**Category:** correctness (public-facing availability bug)

## Context — why this matters

`/busca` (`src/app/(storefront)/busca/page.tsx`) is a public, no-login page
— exactly the kind of surface the PRD calls out for needing to "load
quickly" and be robust, since any visitor can hit it with arbitrary input.
Its query function, `searchPublicProducts` in
`src/lib/queries/public-products.ts`, builds a PostgREST `.or()` filter
string by directly concatenating the raw (trimmed, wildcard-wrapped) user
search term into the filter syntax, with no escaping:

```ts
// src/lib/queries/public-products.ts:111-149
export async function searchPublicProducts(
  storeId: string,
  searchQuery: string,
  limit = 24,
): Promise<PublicProductRow[]> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const term = `%${trimmed}%`;

  const [{ data: teamMatches }, { data: collectionMatches }, { data: competitionMatches }] =
    await Promise.all([
      supabase.from("teams").select("id").eq("store_id", storeId).ilike("name", term),
      supabase.from("collections").select("id").eq("store_id", storeId).ilike("name", term),
      supabase.from("competitions").select("id").eq("store_id", storeId).ilike("name", term),
    ]);

  const orParts = [`name.ilike.${term}`, `season.ilike.${term}`];
  if (teamMatches?.length) orParts.push(`team_id.in.(${teamMatches.map((t) => t.id).join(",")})`);
  if (collectionMatches?.length) {
    orParts.push(`collection_id.in.(${collectionMatches.map((c) => c.id).join(",")})`);
  }
  if (competitionMatches?.length) {
    orParts.push(`competition_id.in.(${competitionMatches.map((c) => c.id).join(",")})`);
  }

  const { data, error } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("store_id", storeId)
    .or(orParts.join(","))
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "product_images", ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to search products: ${error.message}`);
  return (data ?? []) as unknown as PublicProductRow[];
}
```

PostgREST's `.or()` filter syntax uses `,` to separate individual
conditions and `(`/`)`/`.`/`:` as structural characters inside a condition;
per PostgREST's own documentation, a filter *value* containing any of
those characters must be double-quoted (with internal `\` and `"`
backslash-escaped), or PostgREST cannot parse the combined expression. This
code never quotes `term` before splicing it into `name.ilike.${term}` and
`season.ilike.${term}`.

**Confirmed impact** (verified independently by a security-focused audit
pass, not just this one): a search for something as ordinary as "time
retrô, temporada 1994" — comma included — produces a malformed `.or()`
string that Postgres/PostgREST cannot parse. `searchPublicProducts` then
does `if (error) throw new Error(...)`, and `busca/page.tsx` (line 20)
calls it with no `try`/`catch`, so the error propagates uncaught straight
into the Server Component render — any unauthenticated visitor typing a
common punctuation character into search gets an unhandled server error
instead of results. This is **not** a tenant-boundary or data-exposure
bug: `store_id` is always applied via a separate `.eq()` outside the
injected string, and Postgres RLS is enforced as an implicit `AND`
regardless of what the request's own filter clause says — both act as
independent guardrails a malformed/crafted `.or()` string can't get past.
The real, confirmed problem is availability/correctness: broken search UX
on ordinary input.

## Implementation

Add a small, pure, testable escaping helper — following this codebase's
existing convention of keeping this kind of logic in `src/domain/` with a
matching test file (see `src/domain/product-image.ts` /
`src/domain/__tests__/product-image.test.ts` for the pattern to match).

Create `src/domain/postgrest-filter.ts`:

```ts
/**
 * Escapes a value for safe interpolation into a PostgREST filter
 * expression (e.g. inside `.or()`). PostgREST requires values containing
 * `,` `.` `:` `(` `)` to be double-quoted, with `\` and `"` inside the
 * value backslash-escaped first — see PostgREST's filtering docs ("Column
 * or Value contains: `,`, `.`, `:`, `(`, `)`"). This project always
 * double-quotes the value regardless of whether it actually contains one
 * of those characters — that's valid and simpler than checking first.
 *
 * Used wherever user-supplied text (as opposed to values this codebase
 * generated itself, like UUIDs read back from our own queries) is spliced
 * into a `.or()`/`.and()` filter string built by hand — see
 * src/lib/queries/public-products.ts's searchPublicProducts.
 */
export function escapePostgrestFilterValue(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}
```

Add the matching test file `src/domain/__tests__/postgrest-filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { escapePostgrestFilterValue } from "../postgrest-filter";

describe("escapePostgrestFilterValue", () => {
  it("wraps a plain value in double quotes", () => {
    expect(escapePostgrestFilterValue("%flamengo%")).toBe('"%flamengo%"');
  });

  it("escapes a comma so it can't be read as a filter separator", () => {
    expect(escapePostgrestFilterValue("%retrô, 1994%")).toBe('"%retrô, 1994%"');
  });

  it("escapes parentheses", () => {
    expect(escapePostgrestFilterValue("%time (reserva)%")).toBe('"%time (reserva)%"');
  });

  it("escapes an embedded double quote", () => {
    expect(escapePostgrestFilterValue('%"special"%')).toBe('"%\\"special\\"%"');
  });

  it("escapes an embedded backslash before escaping quotes", () => {
    expect(escapePostgrestFilterValue("%a\\b%")).toBe('"%a\\\\b%"');
  });
});
```

Then use it in `src/lib/queries/public-products.ts`'s `searchPublicProducts`
— only where `term` (user input) is spliced in; the `team_id.in.(...)` /
`collection_id.in.(...)` / `competition_id.in.(...)` lists are built from
UUIDs this codebase already fetched from its own database, not from user
input, and don't need escaping:

```ts
import { escapePostgrestFilterValue } from "@/domain/postgrest-filter";

// ...inside searchPublicProducts, replace:
  const orParts = [`name.ilike.${term}`, `season.ilike.${term}`];
// with:
  const escapedTerm = escapePostgrestFilterValue(term);
  const orParts = [`name.ilike.${escapedTerm}`, `season.ilike.${escapedTerm}`];
```

No other line in the function needs to change.

## Explicitly out of scope

- Do not add a global `error.tsx` boundary for the `(storefront)` route
  group as part of this plan, even though it would also help here — that
  benefits every public page, not just search, and is a broader UX
  decision worth its own discussion rather than folding it into a
  one-line escaping fix. Flag it to the user as a possible follow-up if
  you want, but don't implement it here.
- Do not change the `ilike`-based search approach itself (e.g. to a
  full-text-search index) — PRD §19 explicitly specifies deterministic,
  non-AI search, and performance of `ilike` at this project's current
  scale isn't the problem this plan is fixing.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
```

The new test file should show 5/5 passing. Also manually (or via a quick
script) confirm the fix against a real or local Supabase project: search
for a string containing a comma and/or parentheses and confirm it returns
a normal (possibly empty) result list instead of throwing.

## Done criteria

- `src/domain/postgrest-filter.ts` and its test file exist as described.
- `searchPublicProducts` uses `escapePostgrestFilterValue` on `term` for
  both `ilike` conditions.
- `npm run typecheck && npm run lint && npm run test` all pass, including
  the 5 new tests.
- A search containing `,`, `(`, `)`, or `"` no longer throws.

## Maintenance note

If a future change adds more hand-built PostgREST filter strings anywhere
else in this codebase (rather than using the query builder's structured
methods like `.eq()`/`.ilike()`/`.in()` directly, which don't have this
problem because supabase-js handles their escaping internally), route any
user-supplied value through `escapePostgrestFilterValue` the same way.
