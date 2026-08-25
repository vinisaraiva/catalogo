# Plan 004 — Fix `reorderProductImages`' "same set" check to detect duplicate ids

**Status:** TODO
**Category:** correctness

## Context — why this matters

`reorderProductImages` (`src/lib/actions/product-images.ts:209-245`) is
the single action behind both "reorder images" and "select primary image"
(TASKS.md Phase 5) — the caller always sends the *full* new ordering of a
product's image ids, and the server rewrites `sort_order` to match, with
index 0 always meaning "primary/cover image" (see
`src/lib/queries/public-products.ts`'s `PublicProductRow` doc comment and
`src/components/storefront/product-card.tsx`, both of which read
`product_images[0]` as the cover photo).

Before writing anything, the action checks that `orderedIds` is exactly
the product's current set of image ids, just reordered — this exists
specifically so a stale client (e.g. a second browser tab open on the same
product) can't silently drop an image:

```ts
// src/lib/actions/product-images.ts:216-229
  const { data: current, error: currentError } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("store_id", store.id);

  if (currentError) {
    return actionError(`Não foi possível carregar as imagens: ${currentError.message}`);
  }

  const currentIds = new Set((current ?? []).map((row) => row.id));
  const sameSet =
    orderedIds.length === currentIds.size && orderedIds.every((id) => currentIds.has(id));
  if (!sameSet) return actionError("Lista de imagens desatualizada — recarregue a página.");
```

**The bug:** this check is multiset-blind. If a product has images
`[A, B]`, a call with `orderedIds = [A, A]` passes: `orderedIds.length`
(2) equals `currentIds.size` (2), and every id in `orderedIds` (`A`, `A`)
is present in `currentIds`. But `B` is silently missing and `A` appears
twice. The write loop right after (lines 231-239) then does
`update({ sort_order: 0 })` on row `A`, then `update({ sort_order: 1 })`
on row `A` again (last write wins) — leaving `B` at whatever `sort_order`
it already had, which can now collide with `A`'s. There's no unique
constraint on `product_images.sort_order` (see
`supabase/migrations/20260825000001_initial_schema.sql:193-203` — no such
constraint exists there) to catch this at the database layer either. The
practical effect: which image is treated as "primary" can silently become
wrong, and it can happen from perfectly ordinary conditions (a slow
double-tap on "mover para cima" in `product-images-manager.tsx`, or two
browser tabs), not just malicious input.

## Implementation

Following this codebase's existing convention of pulling small, pure,
testable pieces of logic into `src/domain/` (see `src/domain/product-image.ts`
for the sibling module this one lives next to) rather than leaving
validation logic inline inside a Server Action where it can't be unit
tested — Server Actions in this repo have no test harness at all yet (see
`plans/README.md`), but domain modules do, via plain Vitest.

Create `src/domain/product-image-reorder.ts`:

```ts
/**
 * Validates that `orderedIds` is exactly `currentIds`, reordered — no
 * id missing, none added, and (the bug this function exists to fix) none
 * duplicated. A naive `length` + `every(id => set.has(id))` check is
 * multiset-blind: it can't tell `[A, A]` apart from `[A, B]` when both
 * have length 2 and both ids happen to already be in `currentIds`. See
 * plans/004-reorder-duplicate-id-validation.md for the full story.
 */
export function isValidReorder(currentIds: string[], orderedIds: string[]): boolean {
  const currentSet = new Set(currentIds);
  const orderedSet = new Set(orderedIds);
  return (
    orderedIds.length === orderedSet.size && // no duplicates in orderedIds
    orderedSet.size === currentSet.size && // same cardinality
    orderedIds.every((id) => currentSet.has(id)) // same membership
  );
}
```

Add the matching test file `src/domain/__tests__/product-image-reorder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidReorder } from "../product-image-reorder";

describe("isValidReorder", () => {
  it("accepts a genuine reordering of the same ids", () => {
    expect(isValidReorder(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });

  it("accepts an unchanged order", () => {
    expect(isValidReorder(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("rejects a duplicated id standing in for a missing one", () => {
    // The bug this function fixes: same length, every id technically
    // present in currentIds, but "b" is missing and "a" appears twice.
    expect(isValidReorder(["a", "b"], ["a", "a"])).toBe(false);
  });

  it("rejects a missing id even without a duplicate", () => {
    expect(isValidReorder(["a", "b", "c"], ["a", "b"])).toBe(false);
  });

  it("rejects an id that doesn't belong to the current set", () => {
    expect(isValidReorder(["a", "b"], ["a", "z"])).toBe(false);
  });

  it("treats two empty lists as valid (nothing to reorder)", () => {
    expect(isValidReorder([], [])).toBe(true);
  });
});
```

Then use it in `src/lib/actions/product-images.ts`, replacing the inline
check:

```ts
import { isValidReorder } from "@/domain/product-image-reorder";

// ...inside reorderProductImages, replace:
  const currentIds = new Set((current ?? []).map((row) => row.id));
  const sameSet =
    orderedIds.length === currentIds.size && orderedIds.every((id) => currentIds.has(id));
  if (!sameSet) return actionError("Lista de imagens desatualizada — recarregue a página.");
// with:
  const currentIds = (current ?? []).map((row) => row.id);
  if (!isValidReorder(currentIds, orderedIds)) {
    return actionError("Lista de imagens desatualizada — recarregue a página.");
  }
```

Note the type change: `currentIds` becomes a plain `string[]` (matching
`isValidReorder`'s signature) instead of a `Set<string>` — double-check no
other line in `reorderProductImages` still expects it to be a `Set` (as of
this writing, nothing else in the function reads `currentIds` after this
check, but re-read the current file before editing in case that's changed).

## Explicitly out of scope

- Do not fix the separate "no rollback if some of the parallel updates
  fail" issue in the same function (lines 231-241) — that's a related but
  distinct bug, listed separately in `plans/README.md`'s "other findings",
  not part of this plan.
- Do not fix the concurrent-upload `sort_order` race in
  `uploadProductImages` (lines 82-91) — also listed separately, also not
  part of this plan.
- Do not add a unique database constraint on `(product_id, sort_order)` —
  worth considering, but it's a schema/migration change with its own
  blast radius (e.g. how it interacts with the reorder loop's intermediate
  states while `Promise.all` is still in flight) that goes beyond fixing
  this validation bug, and wasn't part of what was asked for here.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
```

The new test file should show 6/6 passing.

## Done criteria

- `src/domain/product-image-reorder.ts` and its test file exist as
  described.
- `reorderProductImages` in `src/lib/actions/product-images.ts` calls
  `isValidReorder` instead of the inline multiset-blind check.
- `npm run typecheck && npm run lint && npm run test` all pass, including
  the 6 new tests.
- Manually (or via a quick script against a real/local Supabase project):
  calling `reorderProductImages` with a duplicated id in place of a
  missing one now returns the "Lista de imagens desatualizada" error
  instead of silently corrupting `sort_order`.

## Maintenance note

If a similar "is this exactly a reordering of that set" check is ever
needed elsewhere (e.g. for `product_sizes` ordering, if that's ever
added), reuse `isValidReorder` rather than reintroducing the same
multiset-blind bug in a new inline check.
