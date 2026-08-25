"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Shield,
  Layers,
  Trophy,
  Sparkles,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Início", icon: Home, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { href: "/admin/times", label: "Times", icon: Shield, exact: false },
  { href: "/admin/colecoes", label: "Coleções", icon: Layers, exact: false },
  { href: "/admin/competicoes", label: "Competições", icon: Trophy, exact: false },
  { href: "/admin/ia/modelos", label: "Modelos IA", icon: Sparkles, exact: false },
  { href: "/admin/configuracoes", label: "Config.", icon: Settings, exact: false },
] as const;

/**
 * Horizontal, scrollable, large-tap-target nav — mobile-first per
 * ADR-019 (avoid wide desktop-style admin chrome). Only links to sections
 * that exist today; "Modelos IA" and "Config." were added in Phase 6 once
 * those screens actually existed. "Artes" (a dedicated cross-product AI
 * generations gallery) is still Phase 7+ scope — for now, generations are
 * reviewed from each product's own edit page (`AiTryOnPanel`).
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do painel"
      className="border-border bg-background sticky top-0 z-10 border-b"
    >
      <div className="flex gap-1 overflow-x-auto px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-auto flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-2 text-xs font-medium transition-colors"
        >
          <ExternalLink className="size-5" aria-hidden="true" />
          Catálogo
        </Link>
      </div>
    </nav>
  );
}
