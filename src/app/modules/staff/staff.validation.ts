import { z } from "zod";

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  displayName: z.string().min(1).optional(),
  phone: z.string().min(3).optional(),
  designation: z.string().optional(),
});

export const createStaffAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).optional(),
  phone: z.string().min(3).optional(),
  designation: z.string().optional(),
});

export const deactivateStaffSchema = z.object({});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
