import { Router } from "express";

import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { UserController } from "./user.controller";
import { updateMyProfileSchema } from "./user.validation";

const router = Router();

router.patch("/me/profile", checkAuth(), validateRequest(updateMyProfileSchema), UserController.updateMyProfile);
router.get("/", checkAuth(Role.SUPER_ADMIN), UserController.getAllUsers);

export const UserRoutes = router;