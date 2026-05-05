import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { loginUserSchema, registerUserSchema, resendVerificationEmailSchema, verifyEmailOtpSchema, zResetConfirmSchema } from "./auth.validation";

const router = Router()

router.post("/register", validateRequest(registerUserSchema), AuthController.registerUser)
router.post("/login", validateRequest(loginUserSchema), AuthController.loginUser)
router.get("/verify-email", AuthController.verifyEmail)
router.post("/resend-verification", validateRequest(resendVerificationEmailSchema), AuthController.resendVerificationEmail)
router.post("/verify-email-otp", validateRequest(verifyEmailOtpSchema), AuthController.verifyEmailOtp)
router.post("/resend-verification-otp", validateRequest(resendVerificationEmailSchema), AuthController.resendVerificationOtp)
router.post("/logout", AuthController.logout)
router.get("/refresh-token", AuthController.refreshToken)
router.post("/reset-password", validateRequest(resendVerificationEmailSchema), AuthController.requestPasswordReset)
router.post("/reset-password/confirm", validateRequest(zResetConfirmSchema), AuthController.confirmPasswordReset)
router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);

export const AuthRoutes = router;