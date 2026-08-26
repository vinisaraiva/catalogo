"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "catalogo-theme";
const DARK_CLASS = "storefront-dark";

/**
 * Manual light/dark switch for the storefront (DECISIONS.md ADR-032).
 * The store's official look is the light theme — this only offers dark as
 * an opt-in, remembered per browser via localStorage. No React context: a
 * single button reading/writing one class (`storefront-dark`) directly on
 * `#storefront-root` is simpler than wiring a provider for one toggle.
 *
 * The initial render always shows the light-mode (Moon) icon regardless of
 * the stored preference, then corrects itself in `useEffect` once the DOM
 * class set by the blocking init script (`(storefront)/layout.tsx`) can be
 * read — matching what SSR actually sent avoids a hydration mismatch.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // One-time read of DOM state set by THEME_INIT_SCRIPT before this
    // component ever mounted — there's no React state to synchronize
    // from and no external subscription to set up, just a single value
    // to pick up post-hydration, so the usual "don't setState in an
    // effect" guidance doesn't have an alternative here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.getElementById("storefront-root")?.classList.contains(DARK_CLASS) ?? false);
  }, []);

  function toggle() {
    const root = document.getElementById("storefront-root");
    if (!root) return;
    const next = !root.classList.contains(DARK_CLASS);
    root.classList.toggle(DARK_CLASS, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private browsing / storage disabled — the toggle still works for
      // this page view, it just won't be remembered next visit.
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-current transition-colors hover:bg-white/25"
    >
      {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  );
}

/**
 * Applied via `<script dangerouslySetInnerHTML>` (not `next/script` —
 * `beforeInteractive` is root-layout-only, and this must stay scoped to
 * the storefront) as the FIRST CHILD inside `#storefront-root`
 * ((storefront)/layout.tsx) — not before it. The browser's HTML parser
 * adds an element to the DOM as soon as its opening tag is read, before
 * its children are parsed, so by the time this inline script runs,
 * `#storefront-root` already exists and `getElementById` finds it; a
 * script placed as a *sibling* before the div instead would run before
 * the div exists and silently no-op. Runs synchronously during initial
 * HTML parsing, before first paint, so a saved "dark" preference applies
 * with no flash of the light theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==='dark'){document.getElementById('storefront-root').classList.add(${JSON.stringify(DARK_CLASS)});}}catch(e){}})();`;
