import status from "http-status";

import AppError from "../../errorHelpers/AppError";

interface IInitiatePaymentPayload {
  planId: string;
  amount: number;
  purpose: string;
}

interface IConfirmPaymentPayload {
  paymentReference: string;
  planId: string;
}

const initiatePayment = async (payload: IInitiatePaymentPayload) => {
  // TODO: integrate payment gateway (SSLCommerz/Stripe/other) here.
  // Return the payment session/redirect URL from the gateway response.
  return {
    paymentRequired: true,
    gateway: null,
    note: "Payment gateway integration is pending",
    request: payload,
  };
};

const confirmPayment = async (_payload: IConfirmPaymentPayload) => {
  // TODO: verify payment gateway callback/webhook and then call ShopService.createShop().
  throw new AppError(status.NOT_IMPLEMENTED, "Payment confirmation is not implemented yet");
};

export const PaymentService = {
  initiatePayment,
  confirmPayment,
};