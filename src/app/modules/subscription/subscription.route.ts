import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { SubscriptionController } from "./subscription.controller";
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema, updateSubscriptionStatusSchema } from "./subscription.validation";

const router = Router();

// Public endpoints (no auth required)
router.get("/plans/public", SubscriptionController.getPublicPlans);
router.get("/plans/public/:id", SubscriptionController.getPublicPlan);

// Admin endpoints (SUPER_ADMIN only)
router.get("/plans", checkAuth(Role.SUPER_ADMIN), SubscriptionController.getAllSubscriptionPlans);
router.post("/plans", checkAuth(Role.SUPER_ADMIN), validateRequest(createSubscriptionPlanSchema), SubscriptionController.createSubscriptionPlan);
router.get("/plans/:id", checkAuth(Role.SUPER_ADMIN), SubscriptionController.getSubscriptionPlan);
router.patch("/plans/:id", checkAuth(Role.SUPER_ADMIN), validateRequest(updateSubscriptionPlanSchema), SubscriptionController.updateSubscriptionPlan);
router.delete("/plans/:id", checkAuth(Role.SUPER_ADMIN), SubscriptionController.deleteSubscriptionPlan);
router.get("/records", checkAuth(Role.SUPER_ADMIN), SubscriptionController.getAllShopSubscriptions);
router.patch("/records/:id", checkAuth(Role.SUPER_ADMIN), validateRequest(updateSubscriptionStatusSchema), SubscriptionController.updateShopSubscriptionStatus);

export const SubscriptionRoutes = router;