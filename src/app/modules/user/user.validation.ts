import { z } from "zod";

export const updateMyProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    image: z.string().url("Image must be a valid URL").optional(),
    displayName: z.string().min(1, "Display name is required").optional(),
    phone: z.string().min(6, "Phone number is required").optional(),
    shopName: z.string().min(1, "Shop name is required").optional(),
    preferredShopName: z.string().min(1, "Preferred shop name is required").optional(),
  }),
});