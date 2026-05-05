/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, ShopStatus, SubscriptionStatus, UserStatus } from "../../generated/prisma/enums";

import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";

import { envVars } from "../config/env";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");
        const accessToken = CookieUtils.getCookie(req, 'accessToken');

        let authenticatedUser:
            | {
                userId: string;
                role: Role;
                email: string;
                shopId?: string;
            }
            | undefined;

        const getSubscriptionLockState = (shop: {
            id: string;
            status: ShopStatus;
            subscriptionStatus: SubscriptionStatus;
            trialEndsAt: Date | null;
            subscriptionEndsAt: Date | null;
            isDashboardLocked: boolean;
        }) => {
            const now = new Date();
            const isTrialExpired =
                shop.subscriptionStatus === SubscriptionStatus.TRIAL &&
                !!shop.trialEndsAt &&
                shop.trialEndsAt.getTime() <= now.getTime();
            const isSubscriptionExpired =
                !!shop.subscriptionEndsAt &&
                shop.subscriptionEndsAt.getTime() <= now.getTime();

            if (isTrialExpired || isSubscriptionExpired) {
                return {
                    isLocked: true,
                    shouldPersistExpiry: shop.subscriptionStatus !== SubscriptionStatus.EXPIRED || !shop.isDashboardLocked,
                };
            }

            if (shop.isDashboardLocked) {
                return {
                    isLocked: true,
                    shouldPersistExpiry: false,
                };
            }

            if (shop.status === ShopStatus.SUSPENDED || shop.status === ShopStatus.CLOSED) {
                return {
                    isLocked: true,
                    shouldPersistExpiry: false,
                };
            }

            if (shop.subscriptionStatus === SubscriptionStatus.SUSPENDED || shop.subscriptionStatus === SubscriptionStatus.CANCELED || shop.subscriptionStatus === SubscriptionStatus.EXPIRED) {
                return {
                    isLocked: true,
                    shouldPersistExpiry: false,
                };
            }

            return {
                isLocked: false,
                shouldPersistExpiry: false,
            };
        };

        const persistExpiredLock = async (shopId: string) => {
            const now = new Date();

            await prisma.$transaction(async (tx) => {
                await tx.shop.update({
                    where: { id: shopId },
                    data: {
                        subscriptionStatus: SubscriptionStatus.EXPIRED,
                        isDashboardLocked: true,
                    },
                });

                await tx.shopSubscription.updateMany({
                    where: {
                        shopId,
                        status: {
                            in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE],
                        },
                        endsAt: {
                            lte: now,
                        },
                    },
                    data: {
                        status: SubscriptionStatus.EXPIRED,
                    },
                });
            });
        };

        const resolveAuthenticatedUser = async (userId: string) => {
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    shopOwnerProfile: {
                        include: {
                            shop: true,
                        },
                    },
                    staffProfile: {
                        include: {
                            shop: true,
                        },
                    },
                    superAdminProfile: true,
                },
            });

            if (!user) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User not found.');
            }

            if (user.isDeleted || user.deletedAt) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is deleted.');
            }

            if (user.status !== UserStatus.ACTIVE) {
                throw new AppError(status.FORBIDDEN, 'Unauthorized access! User is not active.');
            }

            let shopId: string | undefined;

            if (user.role === Role.SHOP_OWNER) {
                if (!user.shopOwnerProfile) {
                    throw new AppError(status.FORBIDDEN, 'Unauthorized access! Shop owner profile is missing.');
                }

                const shop = user.shopOwnerProfile.shop;
                if (shop) {
                    const lockState = getSubscriptionLockState(shop);
                    if (lockState.shouldPersistExpiry) {
                        await persistExpiredLock(shop.id);
                    }

                    if (lockState.isLocked) {
                        throw new AppError(status.FORBIDDEN, 'Your subscription has expired or is inactive. Please renew to access the dashboard.');
                    }

                    shopId = shop.id;
                }
            }

            if (user.role === Role.STAFF) {
                if (!user.staffProfile) {
                    throw new AppError(status.FORBIDDEN, 'Unauthorized access! Staff profile is missing.');
                }

                if (!user.staffProfile.isActive) {
                    throw new AppError(status.FORBIDDEN, 'Unauthorized access! Staff account is inactive.');
                }

                const shop = user.staffProfile.shop;
                if (!shop) {
                    throw new AppError(status.FORBIDDEN, 'Unauthorized access! Staff account is not assigned to a shop.');
                }

                const lockState = getSubscriptionLockState(shop);
                if (lockState.shouldPersistExpiry) {
                    await persistExpiredLock(shop.id);
                }

                if (lockState.isLocked) {
                    throw new AppError(status.FORBIDDEN, 'Your subscription has expired or is inactive. Please renew to access the dashboard.');
                }

                shopId = shop.id;
            }

            if (user.role === Role.SUPER_ADMIN && !user.superAdminProfile) {
                throw new AppError(status.FORBIDDEN, 'Unauthorized access! Super admin profile is missing.');
            }

            authenticatedUser = {
                userId: user.id,
                role: user.role,
                email: user.email,
                shopId,
            };
        };

        if (sessionToken) {
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                include: {
                    user: true,
                },
            });

            if (sessionExists?.user) {
                await resolveAuthenticatedUser(sessionExists.user.id);

                const now = new Date();
                const expiresAt = new Date(sessionExists.expiresAt);
                const createdAt = new Date(sessionExists.createdAt);

                const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                const timeRemaining = expiresAt.getTime() - now.getTime();
                const percentRemaining = sessionLifeTime > 0 ? (timeRemaining / sessionLifeTime) * 100 : 0;

                if (percentRemaining < 20) {
                    res.setHeader('X-Session-Refresh', 'true');
                    res.setHeader('X-Session-Expires-At', expiresAt.toISOString());
                    res.setHeader('X-Time-Remaining', timeRemaining.toString());
                }
            }
        }

        if (!authenticatedUser && accessToken) {
            const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

            if (!verifiedToken.success || !verifiedToken.data) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid access token.');
            }

            await resolveAuthenticatedUser(verifiedToken.data.userId);
        }

        if (!authenticatedUser) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access or session token provided.');
        }

        req.user = authenticatedUser;

        if (authRoles.length > 0 && !authRoles.includes(req.user.role)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }
        next();
    } catch (error: any) {
        next(error);
    }
};

