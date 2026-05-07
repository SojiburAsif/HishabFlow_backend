import status from "http-status";

import { Role } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

interface IUpdateMyProfilePayload {
    name?: string;
    image?: string;
    displayName?: string;
    phone?: string;
    shopName?: string;
    preferredShopName?: string;
}

interface IAuthenticatedUser {
    userId: string;
    role: Role;
    email: string;
    shopId?: string;
}

const userProfileInclude = {
    shopOwnerProfile: {
        include: { shop: true },
    },
    superAdminProfile: true,
    staffProfile: {
        include: { shop: true },
    },
} as const;

type UserProfileWithRelations = Prisma.UserGetPayload<{
    include: typeof userProfileInclude;
}>;

type UserProfileResponse = UserProfileWithRelations & {
    shopImage: string | null;
    shopName: string | null;
    displayName: string | null;
    preferredShopName: string | null;
};

const mapUserProfileResponse = (profile: UserProfileWithRelations | null): UserProfileResponse | null => {
    if (!profile) {
        return profile;
    }

    const shopOwnerShop = profile.shopOwnerProfile?.shop as { image?: string | null; shopName?: string | null } | null | undefined;
    const staffShop = profile.staffProfile?.shop as { image?: string | null; shopName?: string | null } | null | undefined;

    return {
        ...profile,
        shopImage: shopOwnerShop?.image ?? staffShop?.image ?? null,
        shopName: shopOwnerShop?.shopName ?? staffShop?.shopName ?? null,
        displayName:
            profile.shopOwnerProfile?.displayName ??
            profile.superAdminProfile?.displayName ??
            profile.staffProfile?.displayName ??
            null,
        preferredShopName: profile.shopOwnerProfile?.preferredShopName ?? null,
    };
};

const getMyProfile = async (user: IAuthenticatedUser) => {
    const profile = await prisma.user.findUnique({
        where: { id: user.userId },
        include: userProfileInclude,
    });

    if (!profile) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    return mapUserProfileResponse(profile);
};

const normalizeSlug = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || `shop-${Date.now()}`;

const updateMyProfile = async (user: IAuthenticatedUser, payload: IUpdateMyProfilePayload, ipAddress?: string) => {
    const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: {
            shopOwnerProfile: {
                include: { shop: true },
            },
            superAdminProfile: true,
            staffProfile: true,
        },
    });

    if (!currentUser) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
        const userUpdate = (payload.name || payload.image) ? await tx.user.update({
            where: { id: user.userId },
            data: {
                ...(payload.name ? { name: payload.name } : {}),
                ...(payload.image ? { image: payload.image } : {}),
            },
        }) : currentUser;

        if (currentUser.role === Role.SHOP_OWNER) {
            const profile = await tx.shopOwnerProfile.upsert({
                where: { userId: user.userId },
                create: {
                    userId: user.userId,
                    displayName: payload.displayName ?? payload.name ?? currentUser.name,
                    phone: payload.phone,
                    preferredShopName: payload.shopName ?? payload.preferredShopName ?? payload.name ?? currentUser.name,
                },
                update: {
                    ...(payload.displayName || payload.name
                        ? { displayName: payload.displayName ?? payload.name }
                        : {}),
                    ...(payload.phone ? { phone: payload.phone } : {}),
                    ...(payload.shopName || payload.preferredShopName
                        ? { preferredShopName: payload.shopName ?? payload.preferredShopName }
                        : {}),
                },
                include: { shop: true },
            });
        }

        if (currentUser.role === Role.SUPER_ADMIN) {
            await tx.superAdminProfile.upsert({
                where: { userId: user.userId },
                create: {
                    userId: user.userId,
                    displayName: payload.displayName ?? payload.name ?? currentUser.name,
                    ...(ipAddress ? { ipAddress } : {}),
                },
                update: {
                    displayName: payload.displayName ?? payload.name,
                    ...(ipAddress ? { ipAddress } : {}),
                },
            });
        }

        if (currentUser.role === Role.STAFF) {
            await tx.staffProfile.updateMany({
                where: { userId: user.userId },
                data: {
                    displayName: payload.displayName ?? payload.name,
                    phone: payload.phone,
                },
            });
        }

        return userUpdate;
    });

    return prisma.user.findUnique({
        where: { id: updatedUser.id },
        include: userProfileInclude,
    }).then(mapUserProfileResponse);
};

const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            shopOwnerProfile: {
                include: { shop: true },
            },
            superAdminProfile: true,
            staffProfile: {
                include: { shop: true },
            },
        },
    });

    // For admin-facing responses, include user's name and email inside superAdminProfile
    return users.map((u) => {
        if (u.superAdminProfile) {
            return {
                ...u,
                superAdminProfile: {
                    ...u.superAdminProfile,
                    userName: u.name,
                    userEmail: u.email,
                },
            };
        }

        return u;
    });
};

export const UserService = {
    getMyProfile,
    updateMyProfile,
    getAllUsers,
};