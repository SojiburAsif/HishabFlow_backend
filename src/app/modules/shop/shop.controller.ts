import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ShopService } from "./shop.service";
import { StaffService } from "../staff/staff.service";
import { createStaffAccountSchema } from "../staff/staff.validation";

// Initiate shop creation with payment
const initiateShopCheckout = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.initiateShopCheckout(req.user!, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Stripe checkout session created successfully",
    data: result,
  });
});

const createShop = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.createShop(req.user!, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Shop created successfully after payment confirmation",
    data: result,
  });
});

const getMyShop = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.getMyShop(req.user!);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Shop retrieved successfully",
    data: result,
  });
});

const updateMyShop = catchAsync(async (req: Request, res: Response) => {
  const result = await ShopService.updateMyShop(req.user!, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Shop updated successfully",
    data: result,
  });
});

const createStaffAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.createStaffAccount(req.user!, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Staff account created successfully",
    data: result,
  });
});

const getShopStaff = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.listStaff(req.user!);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Shop staff retrieved successfully",
    data: result,
  });
});

export const ShopController = {
  initiateShopCheckout,
  createShop,
  getMyShop,
  updateMyShop,
  createStaffAccount,
  getShopStaff,
};