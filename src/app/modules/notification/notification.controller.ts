import { Request, Response } from "express";
import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { NotificationService } from "./notification.service";

const testSendNotification = catchAsync(async (req: Request, res: Response) => {
  const { email, subject, message } = req.body;
  await NotificationService.sendEmailNotification(email, subject, message);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notification sent (check server logs for details)",
  });
});

const notifySubscriptionExpiring = catchAsync(async (req: Request, res: Response) => {
  const { shopId } = req.body;
  await NotificationService.notifySubscriptionExpiring(shopId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Subscription expiring notification sent",
  });
});

const notifyPlanPurchased = catchAsync(async (req: Request, res: Response) => {
  const { shopId, planName } = req.body;
  await NotificationService.notifyPlanPurchased(shopId, planName);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Plan purchase notification sent",
  });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const notifications = NotificationService.listMyNotifications(req.user!.userId, req.user!.role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notifications retrieved successfully",
    data: notifications,
  });
});

const getAdminNotifications = catchAsync(async (_req: Request, res: Response) => {
  const notifications = NotificationService.listAdminNotifications();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin notifications retrieved successfully",
    data: notifications,
  });
});

export const NotificationController = {
  testSendNotification,
  notifySubscriptionExpiring,
  notifyPlanPurchased,
  getMyNotifications,
  getAdminNotifications,
};
