import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { PaymentController } from "./payment.controller";
import { confirmPaymentSchema, initiatePaymentSchema } from "./payment.validation";

const router = Router();

// Webhook route (no auth needed, raw body)
router.post("/webhook", PaymentController.handleStripeWebhookEvent);
// Stripe redirect targets
router.get("/success", PaymentController.paymentSuccess);
router.get("/cancel", PaymentController.paymentCancel);

router.post("/initiate", checkAuth(Role.SHOP_OWNER), validateRequest(initiatePaymentSchema), PaymentController.initiatePayment);
router.post("/confirm", checkAuth(Role.SHOP_OWNER), validateRequest(confirmPaymentSchema), PaymentController.confirmPayment);

export const PaymentRoutes = router;