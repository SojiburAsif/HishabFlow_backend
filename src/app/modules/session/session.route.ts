import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SessionController } from "./session.controller";
import { sessionIdParamSchema } from "./session.validation";

const router = Router();

router.get("/me", checkAuth(Role.SHOP_OWNER, Role.STAFF, Role.SUPER_ADMIN), SessionController.getMySessions);
router.get("/admin", checkAuth(Role.SUPER_ADMIN), SessionController.getAllSessions);
router.delete("/me/:sessionId", checkAuth(Role.SHOP_OWNER, Role.STAFF, Role.SUPER_ADMIN), validateRequest(sessionIdParamSchema), SessionController.deleteSessionById);
router.delete("/admin/:sessionId", checkAuth(Role.SUPER_ADMIN), validateRequest(sessionIdParamSchema), SessionController.deleteSessionById);
router.delete("/current", checkAuth(Role.SHOP_OWNER, Role.STAFF, Role.SUPER_ADMIN), SessionController.deleteCurrentSession);

export const SessionRoutes = router;
