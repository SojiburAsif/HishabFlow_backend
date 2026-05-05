import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get("/me", checkAuth(Role.SHOP_OWNER, Role.STAFF, Role.SUPER_ADMIN), NotificationController.getMyNotifications);
router.get("/admin", checkAuth(Role.SUPER_ADMIN), NotificationController.getAdminNotifications);

router.post("/test", checkAuth(Role.SUPER_ADMIN), NotificationController.testSendNotification);
router.post("/subscription-expiring", checkAuth(Role.SUPER_ADMIN), NotificationController.notifySubscriptionExpiring);
router.post("/plan-purchased", checkAuth(Role.SUPER_ADMIN), NotificationController.notifyPlanPurchased);

export const NotificationRoutes = router;
