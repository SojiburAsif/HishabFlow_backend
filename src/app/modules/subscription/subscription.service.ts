import status from "http-status";

import { Prisma } from "../../../generated/prisma/client";
import { Role, SubscriptionStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

interface IAuthenticatedUser {
  userId: string;
  role: Role;
  email: string;
  shopId?: string;
}

interface ICreateSubscriptionPlanPayload {
  code: string;
  name: string;
  billingCycle: "MONTHLY" | "YEARLY";
  price: number;
  currencyCode?: string;
  durationDays: number;
  maxStaff?: number;
  maxProducts?: number;
  features?: Record<string, unknown>;
}

interface IUpdateSubscriptionPlanPayload {
  name?: string;
  billingCycle?: "MONTHLY" | "YEARLY";
  price?: number;
  currencyCode?: string;
  durationDays?: number;
  maxStaff?: number;
  maxProducts?: number;
  features?: Record<string, unknown>;
  isActive?: boolean;
}

interface IUpdateSubscriptionStatusPayload {
  status: SubscriptionStatus;
  note?: string;
  paymentReference?: string;
}

const requireAdmin = (user: IAuthenticatedUser) => {
  if (user.role !== Role.SUPER_ADMIN) {
    throw new AppError(status.FORBIDDEN, "Only super admin can manage subscriptions");
  }
};

const getAllSubscriptionPlans = async (user: IAuthenticatedUser) => {
  requireAdmin(user);
  return prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscriptions: true },
  });
};

const createSubscriptionPlan = async (user: IAuthenticatedUser, payload: ICreateSubscriptionPlanPayload) => {
  requireAdmin(user);

    return prisma.subscriptionPlan.create({
    data: {
      code: payload.code,
      name: payload.name,
      billingCycle: payload.billingCycle,
      price: new Prisma.Decimal(payload.price),
      currencyCode: payload.currencyCode ?? "BDT",
      durationDays: payload.durationDays,
      maxStaff: payload.maxStaff ?? 1,
      maxProducts: payload.maxProducts ?? 100,
        features: payload.features as Prisma.InputJsonValue | undefined,
    },
  });
};

const updateSubscriptionPlan = async (user: IAuthenticatedUser, planId: string, payload: IUpdateSubscriptionPlanPayload) => {
  requireAdmin(user);

  const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found");
  }

  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.billingCycle ? { billingCycle: payload.billingCycle } : {}),
      ...(payload.price !== undefined ? { price: new Prisma.Decimal(payload.price) } : {}),
      ...(payload.currencyCode ? { currencyCode: payload.currencyCode } : {}),
      ...(payload.durationDays !== undefined ? { durationDays: payload.durationDays } : {}),
      ...(payload.maxStaff !== undefined ? { maxStaff: payload.maxStaff } : {}),
      ...(payload.maxProducts !== undefined ? { maxProducts: payload.maxProducts } : {}),
      ...(payload.features ? { features: payload.features as Prisma.InputJsonValue } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
};

const getAllShopSubscriptions = async (user: IAuthenticatedUser) => {
  requireAdmin(user);

  return prisma.shopSubscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      shop: true,
      plan: true,
    },
  });
};

const updateShopSubscriptionStatus = async (user: IAuthenticatedUser, subscriptionId: string, payload: IUpdateSubscriptionStatusPayload) => {
  requireAdmin(user);

  const existing = await prisma.shopSubscription.findUnique({ where: { id: subscriptionId } });
  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Subscription record not found");
  }

  const updated = await prisma.shopSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: payload.status,
      note: payload.note,
      paymentReference: payload.paymentReference,
    },
  });

  await prisma.shop.update({
    where: { id: existing.shopId },
    data: {
      subscriptionStatus: payload.status,
      isDashboardLocked:
        payload.status === SubscriptionStatus.EXPIRED ||
        payload.status === SubscriptionStatus.SUSPENDED ||
        payload.status === SubscriptionStatus.CANCELED,
    },
  });

  return updated;
};

export const SubscriptionService = {
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getAllShopSubscriptions,
  updateShopSubscriptionStatus,
};