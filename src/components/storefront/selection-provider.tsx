"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SelectionItem } from "@/domain/whatsapp";

const STORAGE_KEY = "catalogo:selection";

interface SelectionContextValue {
  items: SelectionItem[];
  addItem: (item: SelectionItem) => void;
  removeItem: (productId: string, size: string | null) => void;
  clear: () => void;
  isSelected: (productId: string, size: string | null) => boolean;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

function sameItem(
  a: { productId: string; size: string | null },
  b: { productId: string; size: string | null },
) {
  return a.productId === b.productId && a.size === b.size;
}

/**
 * Local, temporary product selection per PRD §22 "Seleção de produtos":
 * "Não implementar carrinho comercial... Sem criar pedido no banco
 * inicialmente." This is intentionally client-only state — it is never
 * sent to the server, and there is no `selections` table. Persisted to
 * `localStorage` purely so it survives a page refresh or a closed tab in
 * the same browser; it is still not an order, and is still lost if the
 * user clears site data or switches devices.
 *
 * Client Component per ARCHITECTURE.md §17 ("local WhatsApp selection
 * basket" is explicitly listed as client-only responsibility). Wraps the
 * storefront layout so the selection survives client-side navigation
 * between pages, not just within one page.
 */
export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read any persisted selection after mount only — reading localStorage
  // during the initial render would make the server-rendered markup
  // (which never has access to it) mismatch the client's first render.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // One-time hydration from localStorage after mount, by design:
      // reading it during the initial render (or a lazy useState
      // initializer) would make the server-rendered markup mismatch the
      // client's first render, since the server never has access to
      // localStorage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as SelectionItem[]);
    } catch {
      // Corrupted or inaccessible storage — start from an empty
      // selection rather than throwing.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable (e.g. private browsing) — the
      // selection still works for the current page lifetime, it just
      // won't persist across a reload.
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: SelectionItem) => {
    setItems((prev) =>
      prev.some((existing) => sameItem(existing, item)) ? prev : [...prev, item],
    );
  }, []);

  const removeItem = useCallback((productId: string, size: string | null) => {
    setItems((prev) => prev.filter((item) => !sameItem(item, { productId, size })));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isSelected = useCallback(
    (productId: string, size: string | null) =>
      items.some((item) => sameItem(item, { productId, size })),
    [items],
  );

  return (
    <SelectionContext.Provider value={{ items, addItem, removeItem, clear, isSelected }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within a SelectionProvider");
  return ctx;
}
