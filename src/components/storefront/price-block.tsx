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
    return <p className={cn("text-xs text-muted-foreground", className)}>{display.label}</p>;
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {display.originalLabel ? (
        <p className="text-muted-foreground text-xs line-through">De: {display.originalLabel}</p>
      ) : null}
      <p className="text-sm font-bold text-foreground">
        {display.originalLabel ? "A partir de " : ""}{display.label}
      </p>
    </div>
  );
}
