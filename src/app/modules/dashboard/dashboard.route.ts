import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/checkAuth";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get("/stats", checkAuth(Role.SUPER_ADMIN, Role.SHOP_OWNER, Role.STAFF), DashboardController.getStats);

export const DashboardRoutes = router;