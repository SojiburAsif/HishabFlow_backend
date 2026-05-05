import { z } from "zod";

export const initiateCheckoutSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "Plan ID is required"),
    shopName: z.string().min(1, "Shop name is required"),
    image: z.string().url("Shop image must be a valid URL").optional(),
    description: z.string().optional(),
  }),
});

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

export const updateMyShopSchema = z.object({
  body: z.object({
    shopName: z.string().min(1, "Shop name is required").optional(),
    image: z.string().url("Shop image must be a valid URL").optional(),
    description: z.string().min(1, "Description is required").optional(),
    currencyCode: z.string().min(3, "Currency code is required").optional(),
    timezone: z.string().min(2, "Timezone is required").optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
});