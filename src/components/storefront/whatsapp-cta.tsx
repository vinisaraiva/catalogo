import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { buildWhatsappUrl } from "@/domain/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Generic WhatsApp entry point — PRD §17 Home "botão WhatsApp" and §20
 * Product page "CTA WhatsApp", the latter explicitly listed as a
 * "placeholder" in TASKS.md Phase 3. The reusable per-product message
 * builder (URL + size/name interpolation per PRD §23) is Phase 4 scope —
 * this component just opens a chat with the store's number and an
 * optional static message, with no dynamic templating logic to extract
 * later.
 */
export function WhatsappCta({
  phoneNumber,
  message,
  className,
  size,
  children,
}: {
  phoneNumber: string;
  message?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}) {
  const href = buildWhatsappUrl(phoneNumber, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ size }), className)}
    >
      <MessageCircle /> {children}
    </a>
  );
}
