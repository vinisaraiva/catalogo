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
