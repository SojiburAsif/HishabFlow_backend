import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CookieUtils } from "../../utils/cookie";
import { SessionService } from "./session.service";

const getMySessions = catchAsync(async (req: Request, res: Response) => {
    const result = await SessionService.getMySessions(req.user!);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My sessions retrieved successfully",
        data: result,
    });
});

const getAllSessions = catchAsync(async (req: Request, res: Response) => {
    const result = await SessionService.getAllSessions(req.user!);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All sessions retrieved successfully",
        data: result,
    });
});

const deleteSessionById = catchAsync(async (req: Request, res: Response) => {
    const result = await SessionService.deleteSessionById(req.user!, String(req.params.sessionId));

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const deleteCurrentSession = catchAsync(async (req: Request, res: Response) => {
    const result = await SessionService.deleteCurrentSession(req.cookies["better-auth.session_token"]);

    CookieUtils.clearCookie(res, "accessToken", { path: "/", httpOnly: true });
    CookieUtils.clearCookie(res, "refreshToken", { path: "/", httpOnly: true });
    CookieUtils.clearCookie(res, "better-auth.session_token", { path: "/", httpOnly: true });

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

export const SessionController = {
    getMySessions,
    getAllSessions,
    deleteSessionById,
    deleteCurrentSession,
};
