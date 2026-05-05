import status from "http-status";

import { Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";

interface IRegisterPayload {
    name: string;
    email: string;
    password: string;
    image?: string;
    displayName?: string;
    phone?: string;
    shopName?: string;
    shopImage?: string;
    preferredShopName?: string;
}

interface ILoginUserPayload {
    email: string;
    password: string;
}

const toTokenPayload = (user: {
    id: string;
    role: string;
    name: string;
    email: string;
    status: string;
    isDeleted: boolean;
    emailVerified: boolean;
}) => ({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
});

const registerUser = async (payload: IRegisterPayload) => {
    const data = await auth.api.signUpEmail({
        body: {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        },
    });

    if (!data.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to register user with provided details");
    }

    try {
        let shopOwnerProfile = null as Awaited<ReturnType<typeof prisma.shopOwnerProfile.create>> | null;

        if (data.user.role === Role.SHOP_OWNER) {
            shopOwnerProfile = await prisma.$transaction(async (tx) => {
                const profile = await tx.shopOwnerProfile.create({
                    data: {
                        userId: data.user.id,
                        displayName: payload.displayName ?? data.user.name,
                        phone: payload.phone,
                        preferredShopName: payload.shopName ?? payload.preferredShopName ?? data.user.name,
                    },
                });

                await tx.user.update({
                    where: { id: data.user.id },
                    data: {
                        image: payload.image,
                    },
                });

                return profile;
            });
        }

        const accessToken = data.token ? tokenUtils.getAccessToken(toTokenPayload(data.user)) : undefined;
        const refreshToken = data.token ? tokenUtils.getRefreshToken(toTokenPayload(data.user)) : undefined;

        return {
            ...data,
            profile: shopOwnerProfile,
            accessToken,
            refreshToken,
        };
    } catch (error) {
        await prisma.user.delete({
            where: {
                id: data.user.id,
            },
        }).catch(() => undefined);

        throw error instanceof AppError
            ? error
            : new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create shop owner profile");
    }
};

const loginUser = async (payload: ILoginUserPayload) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });

    if (!existingUser) {
        throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
    }

    if (existingUser.isDeleted || existingUser.deletedAt) {
        throw new AppError(status.NOT_FOUND, "User is deleted");
    }

    if (existingUser.status !== UserStatus.ACTIVE) {
        throw new AppError(status.FORBIDDEN, "User account is not active");
    }

    const data = await auth.api.signInEmail({
        body: {
            email: payload.email,
            password: payload.password,
        },
    });

    if (!data.user) {
        throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
    }

    const accessToken = tokenUtils.getAccessToken(toTokenPayload(data.user));
    const refreshToken = tokenUtils.getRefreshToken(toTokenPayload(data.user));

    return {
        ...data,
        accessToken,
        refreshToken,
    };
};

export const AuthService = {
    registerUser,
    loginUser,
};