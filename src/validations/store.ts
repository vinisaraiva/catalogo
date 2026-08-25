import { z } from "zod";

/**
 * Store profile fields an admin can edit (PRD.md §7 "Store": name, logo,
 * WhatsApp number, Instagram). `slug`, `currency` and `active` are not
 * exposed here — `slug` is the store's URL identity (changing it would
 * break any link already shared with a customer), `currency` has no admin
 * UI need yet (PRD.md never asks for one), and `active` is an operational
 * kill-switch, not a self-service setting (same reasoning as
 * `scripts/seed.ts` being the only writer of it today).
 *
 * `whatsapp_number` is stored as free-form text (parentheses/spaces/dashes
 * are fine) — `buildWhatsappUrl` (`src/domain/whatsapp.ts`) strips
 * everything but digits when building the `wa.me` link, so this only
 * checks that *some* digits are present, not a specific format.
 */
export const storeProfileInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  whatsapp_number: z
    .string()
    .trim()
    .max(30)
    .refine((value) => value === "" || value.replace(/\D/g, "").length >= 8, {
      message: "Informe um número de WhatsApp válido (com DDD)",
    })
    .optional()
    .nullable(),
  instagram_url: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || /^https?:\/\//.test(value), {
      message: "Use um link completo (começando com https://)",
    })
    .optional()
    .nullable(),
});

export type StoreProfileInput = z.infer<typeof storeProfileInputSchema>;
