import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Plain GET form — no client JS needed for basic search submission
 * (TASKS.md Phase 3 "Performance: Minimize client JS"). `/busca` reads
 * `?q=` server-side.
 */
export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/busca" method="GET" role="search" className="relative">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar time, produto, temporada..."
        className="pl-9"
        aria-label="Buscar no catálogo"
      />
    </form>
  );
}
