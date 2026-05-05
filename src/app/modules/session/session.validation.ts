import { z } from "zod";

export const sessionIdParamSchema = z.object({
    params: z.object({
        sessionId: z.string().min(1, "Session ID is required"),
    }),
});
