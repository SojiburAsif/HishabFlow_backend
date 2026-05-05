import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "Plan ID is required"),
    amount: z.number().positive("Amount must be greater than zero"),
    purpose: z.string().min(1, "Purpose is required"),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentReference: z.string().min(1, "Payment reference is required"),
    planId: z.string().min(1, "Plan ID is required"),
  }),
});