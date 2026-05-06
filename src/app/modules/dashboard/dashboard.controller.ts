import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getStats = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getDashboardStats(req.user!);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Dashboard stats retrieved successfully",
        data: result,
    });
});

export const DashboardController = {
    getStats,
};