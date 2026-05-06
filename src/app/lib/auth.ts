import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "./prisma";
import { Role, UserStatus } from "../../generated/prisma/client";
import { envVars } from "../config/env";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    baseURL: envVars.BETTER_AUTH_URL,
    basePath: "/api/auth",

    emailAndPassword: {
        enabled: true,
    },
    
    socialProviders: {
        google: {
            clientId: envVars.GOOGLE_CLIENT_ID || "",
            clientSecret: envVars.GOOGLE_CLIENT_SECRET || "",
            redirectURI: `${envVars.BETTER_AUTH_URL}/api/auth/callback/google`,
        },
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: Role.SHOP_OWNER,
            },
            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE,
            },
            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false,
            },
            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null,
            },
        },
    },
});