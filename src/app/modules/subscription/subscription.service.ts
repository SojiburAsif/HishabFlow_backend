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
  maxInvoices?: number;
  maxReports?: boolean;
  maxDiscounts?: number;
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
  maxInvoices?: number;
  maxReports?: boolean;
  maxDiscounts?: number;
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

// Public: Get all active plans (no auth needed)
const getPublicPlans = async () => {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      billingCycle: true,
      price: true,
      currencyCode: true,
      durationDays: true,
      maxStaff: true,
      maxProducts: true,
      maxInvoices: true,
      maxReports: true,
      maxDiscounts: true,
      features: true,
    },
  });
};

// Public: Get single plan by ID (no auth needed)
const getPublicPlan = async (planId: string) => {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      code: true,
      name: true,
      billingCycle: true,
      price: true,
      currencyCode: true,
      durationDays: true,
      maxStaff: true,
      maxProducts: true,
      maxInvoices: true,
      maxReports: true,
      maxDiscounts: true,
      features: true,
    },
  });
  if (!plan) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found");
  }
  return plan;
};

// Admin: Get all plans with subscription data
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
      maxInvoices: payload.maxInvoices ?? 100,
      maxReports: payload.maxReports ?? false,
      maxDiscounts: payload.maxDiscounts ?? 0,
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
      ...(payload.maxInvoices !== undefined ? { maxInvoices: payload.maxInvoices } : {}),
      ...(payload.maxReports !== undefined ? { maxReports: payload.maxReports } : {}),
      ...(payload.maxDiscounts !== undefined ? { maxDiscounts: payload.maxDiscounts } : {}),
      ...(payload.features ? { features: payload.features as Prisma.InputJsonValue } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
};

const getSubscriptionPlan = async (user: IAuthenticatedUser, planId: string) => {
  requireAdmin(user);
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    include: { subscriptions: true },
  });
  if (!plan) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found");
  }
  return plan;
};

const deleteSubscriptionPlan = async (user: IAuthenticatedUser, planId: string) => {
  requireAdmin(user);
  const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Subscription plan not found");
  }
  // Check if plan has active subscriptions
  const activeSubscriptions = await prisma.shopSubscription.count({
    where: {
      planId,
      status: { not: "CANCELED" },
    },
  });
  if (activeSubscriptions > 0) {
    throw new AppError(status.BAD_REQUEST, `Cannot delete plan with ${activeSubscriptions} active subscription(s)`);
  }
  return prisma.subscriptionPlan.delete({ where: { id: planId } });

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
  // Public
  getPublicPlans,
  getPublicPlan,
  // Admin
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllShopSubscriptions,
  updateShopSubscriptionStatus,
};