import { z } from "zod";

export const priceDisplayModeSchema = z.enum(["show_price", "consult", "hidden"]);
export const productStatusSchema = z.enum(["draft", "active", "sold_out", "hidden"]);

/**
 * Only `team_id` is required (PRD §15 Etapa 1/2: "Somente time será
 * obrigatório"). Everything else may be filled in incrementally across the
 * mobile-first step flow and saved as a draft at any point.
 */
export const productInputSchema = z
  .object({
    team_id: z.string().uuid("Selecione um time"),
    collection_id: z.string().uuid().optional().nullable(),
    competition_id: z.string().uuid().optional().nullable(),
    name: z.string().trim().min(1, "Nome é obrigatório").max(200),
    slug: z
      .string()
      .trim()
      .min(1, "Slug é obrigatório")
      .max(200)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
    season: z.string().trim().max(20).optional().nullable(),
    model: z.string().trim().max(60).optional().nullable(),
    product_type: z.string().trim().max(60).optional().nullable(),
    description: z.string().trim().max(4000).optional().nullable(),
    price: z.coerce.number().min(0).optional().nullable(),
    promotional_price: z.coerce.number().min(0).optional().nullable(),
    price_display_mode: priceDisplayModeSchema.default("show_price"),
    status: productStatusSchema.default("draft"),
    featured: z.boolean().optional(),
    new_arrival: z.boolean().optional(),
    sort_order: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (data) =>
      data.promotional_price == null || data.price == null || data.promotional_price <= data.price,
    {
      message: "O preço promocional não pode ser maior que o preço normal",
      path: ["promotional_price"],
    },
  );

export type ProductInput = z.infer<typeof productInputSchema>;

export const productSizeInputSchema = z.object({
  size: z.string().trim().min(1, "Tamanho é obrigatório").max(10),
  quantity: z.coerce.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

export type ProductSizeInput = z.infer<typeof productSizeInputSchema>;

/**
 * Upload-time image type: only the two traditional (admin-photographed)
 * types from `product_images.image_type` (PRD §15 Etapa 3 "Tirar foto" /
 * "Galeria" never asks the admin to pick a type). `generated` /
 * `social_feed` / `social_story` are written exclusively by the Phase 6/7
 * AI pipeline, never through this upload action — see DECISIONS.md
 * ADR-027.
 */
export const productImageUploadTypeSchema = z.enum(["original", "detail"]);

export type ProductImageUploadType = z.infer<typeof productImageUploadTypeSchema>;
