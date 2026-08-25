import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Native checkbox styled as a toggle switch (no Radix dependency — see
 * select.tsx for the same rationale). Large enough hit target for
 * one-handed mobile use (ADR-019).
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <label className="inline-flex cursor-pointer items-center">
    <input type="checkbox" ref={ref} className="peer sr-only" {...props} />
    <span
      className={cn(
        "bg-input peer-checked:bg-primary relative h-6 w-11 shrink-0 rounded-full transition-colors",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform",
        "peer-checked:after:translate-x-5",
        className,
      )}
    />
  </label>
));
Switch.displayName = "Switch";

export { Switch };
