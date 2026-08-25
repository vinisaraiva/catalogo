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
