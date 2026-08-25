import { z } from "zod";

export const collectionInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug é obrigatório")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

export type CollectionInput = z.infer<typeof collectionInputSchema>;
