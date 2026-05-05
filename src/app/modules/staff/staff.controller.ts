import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { StaffService } from "./staff.service";

const createStaff = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.createStaff(req.user!, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Staff created successfully",
    data: result,
  });
});

const listStaff = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.listStaff(req.user!);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Staff list retrieved",
    data: result,
  });
});

const deactivateStaff = catchAsync(async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const staffId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!staffId) {
    throw new AppError(status.BAD_REQUEST, "Invalid staff id");
  }

  const result = await StaffService.deactivateStaff(req.user!, staffId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Staff deactivated",
    data: result,
  });
});

export const StaffController = {
  createStaff,
  listStaff,
  deactivateStaff,
};
