import { z } from "zod";

export const createSubscriptionPlanSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]),
    price: z.number().positive("Price must be greater than zero"),
    currencyCode: z.string().min(3, "Currency code is required").optional(),
    durationDays: z.number().int().positive("Duration days is required"),
    maxStaff: z.number().int().nonnegative().optional(),
    maxProducts: z.number().int().nonnegative().optional(),
    features: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const updateSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
    price: z.number().positive().optional(),
    currencyCode: z.string().min(3).optional(),
    durationDays: z.number().int().positive().optional(),
    maxStaff: z.number().int().nonnegative().optional(),
    maxProducts: z.number().int().nonnegative().optional(),
    features: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateSubscriptionStatusSchema = z.object({
  body: z.object({
    status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELED", "SUSPENDED"]),
    note: z.string().min(1).optional(),
    paymentReference: z.string().min(1).optional(),
  }),
});