import status from "http-status";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import { Role } from "../../../generated/prisma/enums";
import { sendEmail } from "../../utils/email";
import { WebSocketHub } from "../../lib/websocket";

type NotificationType =
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "PLAN_PURCHASED"
  | "ADMIN_ALERT"
  | "SYSTEM";

type NotificationRecord = {
  id: string;
  type: NotificationType;
  subject: string;
  message: string;
  data?: Record<string, any>;
  recipientUserId?: string;
  recipientRole?: Role;
  createdAt: string;
};

const notificationInbox: NotificationRecord[] = [];

const pushNotification = (notification: Omit<NotificationRecord, "id" | "createdAt">) => {
  const stored = {
    ...notification,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  } satisfies NotificationRecord;

  notificationInbox.unshift(stored);

  if (notificationInbox.length > 250) {
    notificationInbox.length = 250;
  }

  return stored;
};

const getNotificationsForUser = (userId: string, role: Role) => {
  return notificationInbox.filter((notification) => {
    if (notification.recipientUserId) {
      return notification.recipientUserId === userId;
    }

    if (notification.recipientRole) {
      return notification.recipientRole === role;
    }

    return true;
  });
};

const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string,
  htmlBody?: string,
) => {
  await sendEmail({
    to: email,
    subject,
    templateName: "notification",
    templateData: {
      title: subject,
      message,
      ctaLabel: "Open Dashboard",
      ctaUrl: process.env.CLIENT_URL || undefined,
      htmlBody,
    },
  });
};

const notifySubscriptionExpiring = async (shopId: string) => {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { ownerProfile: { include: { user: true } }, currentPlan: true },
  });

  if (!shop || !shop.ownerProfile || !shop.ownerProfile.user) return;

  const daysLeft = shop.subscriptionEndsAt
    ? Math.ceil((shop.subscriptionEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const subject = `⚠️ Your subscription expires in ${daysLeft} days`;
  const message = `Hello ${shop.ownerProfile.user.name},\n\nYour ${shop.currentPlan?.name || "subscription"} plan is expiring in ${daysLeft} days. Please renew to avoid losing access to your shop.\n\nRenew now: ${process.env.CLIENT_URL || "http://localhost:3000"}/renew-subscription`;

  await sendEmailNotification(shop.ownerProfile.user.email, subject, message);
  pushNotification({
    type: "SUBSCRIPTION_EXPIRING",
    subject,
    message,
    recipientUserId: shop.ownerProfile.user.id,
    data: { shopId, daysLeft },
  });
  WebSocketHub.emitToUser(shop.ownerProfile.user.id, {
    type: "SUBSCRIPTION_EXPIRING",
    subject,
    message,
    recipientUserId: shop.ownerProfile.user.id,
    data: { shopId, daysLeft },
  });
};

const notifySubscriptionExpired = async (shopId: string) => {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { ownerProfile: { include: { user: true } } },
  });

  if (!shop || !shop.ownerProfile || !shop.ownerProfile.user) return;

  const subject = "❌ Your subscription has expired";
  const message = `Hello ${shop.ownerProfile.user.name},\n\nYour subscription has expired. Your shop is now locked. Please renew immediately to regain access.\n\nRenew now: ${process.env.CLIENT_URL || "http://localhost:3000"}/renew-subscription`;

  await sendEmailNotification(shop.ownerProfile.user.email, subject, message);
  pushNotification({
    type: "SUBSCRIPTION_EXPIRED",
    subject,
    message,
    recipientUserId: shop.ownerProfile.user.id,
    data: { shopId },
  });
  WebSocketHub.emitToUser(shop.ownerProfile.user.id, {
    type: "SUBSCRIPTION_EXPIRED",
    subject,
    message,
    recipientUserId: shop.ownerProfile.user.id,
    data: { shopId },
  });
};

const notifyPlanPurchased = async (shopId: string, planName: string) => {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { ownerProfile: { include: { user: true } } },
  });

  if (!shop || !shop.ownerProfile || !shop.ownerProfile.user) return;

  const subject = `🎉 Welcome to ${planName} plan!`;
  const message = `Hello ${shop.ownerProfile.user.name},\n\nCongratulations! Your subscription to the ${planName} plan is now active. You can access all features and start managing your inventory.\n\nAccess dashboard: ${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`;

  await sendEmailNotification(shop.ownerProfile.user.email, subject, message);
  pushNotification({
    type: "PLAN_PURCHASED",
    subject,
    message,
    recipientUserId: shop.ownerProfile.user.id,
    data: { shopId, planName },
  });
  WebSocketHub.emitToUser(shop.ownerProfile.user.id, {
    type: "PLAN_PURCHASED",
    subject,
    message,
    recipientUserId: shop.ownerProfile.user.id,
    data: { shopId, planName },
  });
};

const notifyAdminNewShop = async (shopName: string, ownerName: string, ownerEmail: string) => {
  // Fetch all super admins
  const admins = await prisma.superAdminProfile.findMany({ include: { user: true } });

  for (const admin of admins) {
    const subject = `📢 New shop registered: ${shopName}`;
    const message = `A new shop has been registered.\n\nShop: ${shopName}\nOwner: ${ownerName} (${ownerEmail})\n\nReview in admin panel: ${process.env.CLIENT_URL || "http://localhost:3000"}/admin/shops`;

    await sendEmailNotification(admin.user.email, subject, message);
    pushNotification({
      type: "ADMIN_ALERT",
      subject,
      message,
      recipientUserId: admin.userId,
      recipientRole: Role.SUPER_ADMIN,
      data: { shopName, ownerName, ownerEmail },
    });
    WebSocketHub.emitToUser(admin.userId, {
      type: "ADMIN_ALERT",
      subject,
      message,
      recipientUserId: admin.userId,
      recipientRole: Role.SUPER_ADMIN,
      data: { shopName, ownerName, ownerEmail },
    });
  }
};

const notifyAdminSubscriptionExpired = async (shopName: string, ownerEmail: string) => {
  const admins = await prisma.superAdminProfile.findMany({ include: { user: true } });

  for (const admin of admins) {
    const subject = `⚠️ Subscription expired: ${shopName}`;
    const message = `A shop's subscription has expired and access is blocked.\n\nShop: ${shopName}\nOwner: ${ownerEmail}\n\nReview in admin panel: ${process.env.CLIENT_URL || "http://localhost:3000"}/admin/shops`;

    await sendEmailNotification(admin.user.email, subject, message);
    pushNotification({
      type: "ADMIN_ALERT",
      subject,
      message,
      recipientUserId: admin.userId,
      recipientRole: Role.SUPER_ADMIN,
      data: { shopName, ownerEmail },
    });
    WebSocketHub.emitToUser(admin.userId, {
      type: "ADMIN_ALERT",
      subject,
      message,
      recipientUserId: admin.userId,
      recipientRole: Role.SUPER_ADMIN,
      data: { shopName, ownerEmail },
    });
  }
};

const notifyAdminHighActivity = async (shopName: string, activityType: string) => {
  const admins = await prisma.superAdminProfile.findMany({ include: { user: true } });

  for (const admin of admins) {
    const subject = `📊 High activity detected: ${shopName}`;
    const message = `A shop has detected unusual activity.\n\nShop: ${shopName}\nActivity: ${activityType}\n\nReview in admin panel: ${process.env.CLIENT_URL || "http://localhost:3000"}/admin/activity`;

    await sendEmailNotification(admin.user.email, subject, message);
    pushNotification({
      type: "ADMIN_ALERT",
      subject,
      message,
      recipientUserId: admin.userId,
      recipientRole: Role.SUPER_ADMIN,
      data: { shopName, activityType },
    });
    WebSocketHub.emitToUser(admin.userId, {
      type: "ADMIN_ALERT",
      subject,
      message,
      recipientUserId: admin.userId,
      recipientRole: Role.SUPER_ADMIN,
      data: { shopName, activityType },
    });
  }
};

const listMyNotifications = (userId: string, role: Role) => {
  return getNotificationsForUser(userId, role).slice(0, 50);
};

const listAdminNotifications = () => {
  return notificationInbox.filter((notification) => notification.recipientRole === Role.SUPER_ADMIN).slice(0, 50);
};

export const NotificationService = {
  sendEmailNotification,
  notifySubscriptionExpiring,
  notifySubscriptionExpired,
  notifyPlanPurchased,
  notifyAdminNewShop,
  notifyAdminSubscriptionExpired,
  notifyAdminHighActivity,
  listMyNotifications,
  listAdminNotifications,
};
