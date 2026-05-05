import { z } from "zod";

export const registerUserSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        image: z.string().url("Image must be a valid URL").optional(),
        displayName: z.string().min(1, "Display name is required").optional(),
        phone: z.string().min(6, "Phone number is required").optional(),
        shopName: z.string().min(1, "Shop name is required").optional(),
        shopImage: z.string().url("Shop image must be a valid URL").optional(),
        preferredShopName: z.string().min(1, "Preferred shop name is required").optional(),
    }),
});

export const loginUserSchema = z.object({
    body: z.object({
        email: z.string().email("Valid email is required"),
        password: z.string().min(1, "Password is required"),
    }),
});