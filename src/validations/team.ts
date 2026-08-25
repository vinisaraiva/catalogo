import { z } from "zod";

export const teamTypeSchema = z.enum(["club", "national_team"]);

export const teamInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug é obrigatório")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  type: teamTypeSchema,
  country: z.string().trim().max(80).optional().nullable(),
  logo_url: z.string().url().max(2048).optional().nullable(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

export type TeamInput = z.infer<typeof teamInputSchema>;
