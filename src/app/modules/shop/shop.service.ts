import status from "http-status";

import { Role, ShopStatus, SubscriptionStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";

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

interface IInitiateShopCheckoutPayload {
  planId: string;
  shopName: string;
  image?: string;
  description?: string;
}

interface IUpdateMyShopPayload {
  shopName?: string;
  image?: string;
  description?: string;
  currencyCode?: string;
  timezone?: string;
  lowStockThreshold?: number;
}

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `shop-${Date.now()}`;

// Initiate checkout: Create Stripe session for shop creation
const initiateShopCheckout = async (user: IAuthenticatedUser, payload: IInitiateShopCheckoutPayload) => {
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

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currencyCode.toLowerCase(),
            product_data: {
              name: `${payload.shopName} - ${plan.name}`,
              description: `Subscribe to ${plan.name} plan for your shop`,
            },
            unit_amount: Math.round(plan.price.toNumber() * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/cancel`,
      metadata: {
        userId: user.userId,
        planId: payload.planId,
        shopName: payload.shopName,
        image: payload.image || "",
        description: payload.description || "",
        type: "shop_creation",
      },
    });

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  } catch (error) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create Stripe checkout session");
  }
};

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

const updateMyShop = async (user: IAuthenticatedUser, payload: IUpdateMyShopPayload) => {
  if (user.role !== Role.SHOP_OWNER) {
    throw new AppError(status.FORBIDDEN, "Only shop owners can update shop");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: user.userId },
    include: { shop: true },
  });

  if (!ownerProfile?.shop) {
    throw new AppError(status.NOT_FOUND, "Shop not found for this owner");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.update({
      where: { id: ownerProfile.shop!.id },
      data: {
        ...(payload.shopName
          ? {
              shopName: payload.shopName,
              slug: normalizeSlug(payload.shopName),
            }
          : {}),
        ...(payload.image ? { image: payload.image } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.currencyCode ? { currencyCode: payload.currencyCode } : {}),
        ...(payload.timezone ? { timezone: payload.timezone } : {}),
        ...(payload.lowStockThreshold !== undefined
          ? { lowStockThreshold: payload.lowStockThreshold }
          : {}),
      },
      include: {
        currentPlan: true,
        subscriptions: true,
      },
    });

    if (payload.shopName) {
      await tx.shopOwnerProfile.update({
        where: { id: ownerProfile.id },
        data: {
          preferredShopName: payload.shopName,
        },
      });
    }

    return shop;
  });

  return updated;
};

// Create shop from Stripe payment confirmation (called by webhook)
const createShopFromPayment = async (userId: string, sessionMetadata: any) => {
  const { planId, shopName, image, description } = sessionMetadata;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: userId },
    include: { shop: true },
  });

  if (!ownerProfile) {
    throw new AppError(status.NOT_FOUND, "Shop owner profile not found");
  }

  if (ownerProfile.shop) {
    throw new AppError(status.CONFLICT, "This owner already has a shop");
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.isActive) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found or inactive");
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        ownerProfileId: ownerProfile.id,
        shopName,
        image: image || undefined,
        slug: normalizeSlug(shopName),
        description: description || undefined,
        status: ShopStatus.ACTIVE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartsAt: now,
        subscriptionEndsAt: endsAt,
        currentPlanId: plan.id,
        isDashboardLocked: false,
      },
    });

    // Subscription will be created by payment webhook
    // but we create it here so shop is complete
    const subscription = await tx.shopSubscription.create({
      data: {
        shopId: shop.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startsAt: now,
        endsAt,
        amountPaid: plan.price,
      },
    });

    await tx.shopOwnerProfile.update({
      where: { id: ownerProfile.id },
      data: {
        preferredShopName: shopName,
        onboardingCompleted: true,
      },
    });

    return { shop, subscription };
  });

  return result;
};

export const ShopService = {
  initiateShopCheckout,
  createShop,
  getMyShop,
  updateMyShop,
  createShopFromPayment,
};