import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })),
  note: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
