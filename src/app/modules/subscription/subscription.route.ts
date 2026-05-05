import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { SubscriptionController } from "./subscription.controller";
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema, updateSubscriptionStatusSchema } from "./subscription.validation";

const router = Router();

router.get("/plans", checkAuth(Role.SUPER_ADMIN), SubscriptionController.getAllSubscriptionPlans);
router.post("/plans", checkAuth(Role.SUPER_ADMIN), validateRequest(createSubscriptionPlanSchema), SubscriptionController.createSubscriptionPlan);
router.patch("/plans/:id", checkAuth(Role.SUPER_ADMIN), validateRequest(updateSubscriptionPlanSchema), SubscriptionController.updateSubscriptionPlan);
router.get("/records", checkAuth(Role.SUPER_ADMIN), SubscriptionController.getAllShopSubscriptions);
router.patch("/records/:id", checkAuth(Role.SUPER_ADMIN), validateRequest(updateSubscriptionStatusSchema), SubscriptionController.updateShopSubscriptionStatus);

export const SubscriptionRoutes = router;