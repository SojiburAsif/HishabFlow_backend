import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";
import { prisma } from "../../lib/prisma";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMyProfile(req.user!);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.connection?.remoteAddress;
  const result = await UserService.updateMyProfile(req.user!, req.body, ipAddress as string | undefined);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const result = await UserService.getAllUsers();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

// Diagnostic endpoint to check account setup status
const getAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  
  if (!user) {
    return sendResponse(res, {
      httpStatusCode: status.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
    });
  }

  // Fetch detailed user info
  const userDetails = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      shopOwnerProfile: {
        include: {
          shop: true,
        },
      },
      staffProfile: true,
      superAdminProfile: true,
    },
  });

  if (!userDetails) {
    return sendResponse(res, {
      httpStatusCode: status.NOT_FOUND,
      success: false,
      message: "User not found",
    });
  }

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Account status retrieved",
    data: {
      id: userDetails.id,
      email: userDetails.email,
      emailVerified: !!userDetails.emailVerified,
      status: userDetails.status,
      role: userDetails.role,
      hasShopOwnerProfile: !!userDetails.shopOwnerProfile,
      hasShop: !!userDetails.shopOwnerProfile?.shop,
      hasStaffProfile: !!userDetails.staffProfile,
      hasSuperAdminProfile: !!userDetails.superAdminProfile,
      shopName: userDetails.shopOwnerProfile?.shop?.shopName || null,
      shopStatus: userDetails.shopOwnerProfile?.shop?.status || null,
    },
  });
});

export const UserController = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getAccountStatus,
};