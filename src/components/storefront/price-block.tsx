import { getPriceDisplay } from "@/domain/price";
import type { PriceDisplayMode } from "@/types/database";
import { cn } from "@/lib/utils";

/**
 * The active price renders in the display font/gold accent — a jersey
 * shop's price tag gets the same "scoreboard numerals" treatment as
 * section headings and team names (see `(storefront)/layout.tsx`'s font
 * comment), so it reads as a deliberate price tag, not just another line
 * of body text.
 */
export function PriceBlock({
  price,
  promotionalPrice,
  priceDisplayMode,
  className,
}: {
  price: number | null;
  promotionalPrice: number | null;
  priceDisplayMode: PriceDisplayMode;
  className?: string;
}) {
  const display = getPriceDisplay({ price, promotionalPrice, priceDisplayMode });

  if (display.mode === "hidden") return null;

  if (display.mode === "consult") {
    return (
      <p className={cn("text-muted-foreground text-sm font-medium", className)}>{display.label}</p>
    );
  }

  return (
    <p className={cn("flex items-baseline gap-2", className)}>
      <span className="font-display text-primary tracking-wide">{display.label}</span>
      {display.originalLabel ? (
        <span className="text-muted-foreground text-xs line-through">{display.originalLabel}</span>
      ) : null}
    </p>
  );
}
