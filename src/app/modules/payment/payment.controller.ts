import { Request, Response } from "express";
import status from "http-status";
import type Stripe from "stripe";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";

const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string | undefined;

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: sessionId
      ? "Payment completed successfully. Your shop is being activated."
      : "Payment completed successfully.",
    data: {
      sessionId,
    },
  });
});

const paymentCancel = catchAsync(async (_req: Request, res: Response) => {
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment was cancelled",
  });
});

const handleStripeWebhookEvent = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        return res.status(status.BAD_REQUEST).json({
            success: false,
            message: "Missing Stripe signature or webhook secret",
        });
    }

    let event: any;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        return res.status(status.BAD_REQUEST).json({
            success: false,
            message: "Invalid Stripe webhook signature",
        });
    }

    try {
        const result = await PaymentService.handlerStripeWebhookEvent(event);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Stripe webhook event processed successfully",
            data: result,
        });
    } catch (error) {
        sendResponse(res, {
            httpStatusCode: status.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error handling Stripe webhook event",
        });
    }
};





const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const shopId = req.user?.shopId || req.body.shopId;
  
  if (!shopId) {
    return sendResponse(res, {
      httpStatusCode: status.BAD_REQUEST,
      success: false,
      message: "Shop ID is required",
    });
  }

  // Ensure user's email is verified before allowing subscription purchases
  if (!req.user?.emailVerified) {
    return sendResponse(res, {
      httpStatusCode: status.FORBIDDEN,
      success: false,
      message: "Please verify your email before purchasing a subscription",
    });
  }

  const result = await PaymentService.initiatePayment(req.body, shopId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Stripe checkout session created",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment confirmed successfully",
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getMyPayments(req.user!);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "My payments retrieved successfully",
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.user!);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "All payments retrieved successfully",
    data: result,
  });
});



export const PaymentController = {
  paymentSuccess,
  paymentCancel,
  initiatePayment,
  confirmPayment,
  getMyPayments,
  getAllPayments,
  handleStripeWebhookEvent,
};