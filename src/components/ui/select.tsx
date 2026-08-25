import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native <select>, styled. Deliberately not a Radix/custom listbox — the
 * MVP admin favors simple, robust, mobile-friendly form controls (ADR-019)
 * over a heavier dependency for what is, functionally, a plain dropdown.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "border-input flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-base",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
