import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SubscriptionService } from "./subscription.service";

// Public endpoints
const getPublicPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getPublicPlans();
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Subscription plans retrieved successfully", data: result });
});

const getPublicPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getPublicPlan(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Subscription plan retrieved successfully", data: result });
});

// Admin endpoints
const getAllSubscriptionPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getAllSubscriptionPlans(req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "All subscription plans retrieved successfully", data: result });
});

const createSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.createSubscriptionPlan(req.user!, req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Subscription plan created successfully", data: result });
});

const updateSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.updateSubscriptionPlan(req.user!, req.params.id as string, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Subscription plan updated successfully", data: result });
});

const getSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getSubscriptionPlan(req.user!, req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Subscription plan retrieved successfully", data: result });
});

const deleteSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.deleteSubscriptionPlan(req.user!, req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Subscription plan deleted successfully", data: result });
});

const getAllShopSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getAllShopSubscriptions(req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Shop subscriptions retrieved successfully", data: result });
});

const updateShopSubscriptionStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.updateShopSubscriptionStatus(req.user!, req.params.id as string, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Subscription status updated successfully", data: result });
});

export const SubscriptionController = {
  getPublicPlans,
  getPublicPlan,
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllShopSubscriptions,
  updateShopSubscriptionStatus,
};