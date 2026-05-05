import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  purchasePrice: z.string(),
  sellingPrice: z.string(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
