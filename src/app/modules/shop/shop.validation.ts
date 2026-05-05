import { z } from "zod";

export const createShopSchema = z.object({
  body: z.object({
    shopName: z.string().min(1, "Shop name is required"),
    planId: z.string().min(1, "Plan ID is required"),
    image: z.string().url("Shop image must be a valid URL").optional(),
    description: z.string().min(1, "Description is required").optional(),
    paymentReference: z.string().min(1, "Payment reference is required"),
    subscriptionStartsAt: z.string().datetime().optional(),
  }),
});