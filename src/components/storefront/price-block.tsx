import { getPriceDisplay } from "@/domain/price";
import type { PriceDisplayMode } from "@/types/database";
import { cn } from "@/lib/utils";

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
    return <p className={cn("text-sm font-medium", className)}>{display.label}</p>;
  }

  return (
    <p className={cn("flex items-baseline gap-2", className)}>
      <span className="font-semibold">{display.label}</span>
      {display.originalLabel ? (
        <span className="text-muted-foreground text-sm line-through">{display.originalLabel}</span>
      ) : null}
    </p>
  );
}
