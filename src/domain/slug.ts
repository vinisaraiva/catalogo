/**
 * Deterministic slug generation shared by every admin create form
 * (teams, collections, competitions, products). Kept dependency-free and
 * pure so it's trivially testable.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
