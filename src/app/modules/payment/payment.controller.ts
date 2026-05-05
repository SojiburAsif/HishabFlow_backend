import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.initiatePayment(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment initiation TODO placeholder",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment confirmation TODO placeholder",
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  confirmPayment,
};