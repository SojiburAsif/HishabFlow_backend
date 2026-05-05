import status from "http-status";

import { Role, ShopStatus, SubscriptionStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

interface IAuthenticatedUser {
  userId: string;
  role: Role;
  email: string;
  shopId?: string;
}

interface ICreateShopPayload {
  shopName: string;
  planId: string;
  image?: string;
  description?: string;
  paymentReference: string;
  subscriptionStartsAt?: string;
}

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `shop-${Date.now()}`;

const createShop = async (user: IAuthenticatedUser, payload: ICreateShopPayload) => {
  if (user.role !== Role.SHOP_OWNER) {
    throw new AppError(status.FORBIDDEN, "Only shop owners can create a shop");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: user.userId },
    include: { shop: true },
  });

  if (!ownerProfile) {
    throw new AppError(status.NOT_FOUND, "Shop owner profile not found");
  }

  if (ownerProfile.shop) {
    throw new AppError(status.CONFLICT, "This owner already has a shop");
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: payload.planId },
  });

  if (!plan || !plan.isActive) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found or inactive");
  }

  const now = payload.subscriptionStartsAt ? new Date(payload.subscriptionStartsAt) : new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + plan.durationDays);

  const result = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        ownerProfileId: ownerProfile.id,
        shopName: payload.shopName,
        image: payload.image,
        slug: normalizeSlug(payload.shopName),
        description: payload.description,
        status: ShopStatus.ACTIVE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartsAt: now,
        subscriptionEndsAt: endsAt,
        currentPlanId: plan.id,
        isDashboardLocked: false,
      },
    });

    const subscription = await tx.shopSubscription.create({
      data: {
        shopId: shop.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startsAt: now,
        endsAt,
        paymentReference: payload.paymentReference,
        amountPaid: plan.price,
      },
    });

    await tx.shopOwnerProfile.update({
      where: { id: ownerProfile.id },
      data: {
        preferredShopName: payload.shopName,
        onboardingCompleted: true,
      },
    });

    return { shop, subscription };
  });

  return result;
};

const getMyShop = async (user: IAuthenticatedUser) => {
  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: user.userId },
    include: {
      shop: {
        include: {
          currentPlan: true,
          subscriptions: true,
        },
      },
    },
  });

  if (!ownerProfile?.shop) {
    return null;
  }

  return ownerProfile.shop;
};

export const ShopService = {
  createShop,
  getMyShop,
};