import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { StaffController } from "./staff.controller";
import { createStaffSchema } from "./staff.validation";

const router = Router();

router.post("/", checkAuth(Role.SHOP_OWNER), validateRequest(createStaffSchema), StaffController.createStaff);
router.get("/", checkAuth(Role.SHOP_OWNER), StaffController.listStaff);
router.patch("/:id/deactivate", checkAuth(Role.SHOP_OWNER), StaffController.deactivateStaff);

export const StaffRoutes = router;
