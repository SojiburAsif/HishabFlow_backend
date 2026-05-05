import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { loginUserSchema, registerUserSchema } from "./auth.validation";

const router = Router()

router.post("/register", validateRequest(registerUserSchema), AuthController.registerUser)
router.post("/login", validateRequest(loginUserSchema), AuthController.loginUser)

export const AuthRoutes = router;