import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { OrderService } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.createOrder(req.user!, req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Order created", data: result });
});

const listOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.listOrders(req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Orders listed", data: result });
});

export const OrderController = { createOrder, listOrders };
