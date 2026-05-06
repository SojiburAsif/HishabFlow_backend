import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { tokenUtils } from "../../utils/token";
import { auth } from "../../lib/auth";
import { AuthService } from "./auth.service";
import { CookieUtils } from "../../utils/cookie";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";

const setAuthCookies = (res: Response, tokens: { accessToken?: string; refreshToken?: string; token?: string | null }) => {
    if (tokens.accessToken) {
        tokenUtils.setAccessTokenCookie(res, tokens.accessToken);
    }

    if (tokens.refreshToken) {
        tokenUtils.setRefreshTokenCookie(res, tokens.refreshToken);
    }

    if (tokens.token) {
        tokenUtils.setBetterAuthSessionCookie(res, tokens.token);
    }
};

const registerUser = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await AuthService.registerUser(payload);

        const { accessToken, refreshToken, token, ...rest } = result;

        setAuthCookies(res, { accessToken, refreshToken, token });

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "User registered successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest,
            }
        })
    }
)

const loginUser = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;
        const result = await AuthService.loginUser(payload);
        const { accessToken, refreshToken, token, ...rest } = result;

        setAuthCookies(res, { accessToken, refreshToken, token });

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User logged in successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest,

            },
        })
    }
)

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const email = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email;
    const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;

    const result = await AuthService.verifyEmail({
        email: String(email || ""),
        token: String(token || ""),
    });

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.sendVerificationEmail(req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.verifyEmailOtp(req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const resendVerificationOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resendVerificationOtp(req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
    const sessionToken = _req.cookies["better-auth.session_token"];

    await AuthService.logout({ sessionToken });

    CookieUtils.clearCookie(res, 'accessToken', { path: '/', httpOnly: true });
    CookieUtils.clearCookie(res, 'refreshToken', { path: '/', httpOnly: true });
    CookieUtils.clearCookie(res, 'better-auth.session_token', { path: '/', httpOnly: true });

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Logged out successfully',
    });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const refresh = req.cookies['refreshToken'];
    if (!refresh) {
        return sendResponse(res, {
            httpStatusCode: status.UNAUTHORIZED,
            success: false,
            message: 'No refresh token provided',
        });
    }

    const verified = jwtUtils.verifyToken(refresh, envVars.REFRESH_TOKEN_SECRET);
    if (!verified.success || !verified.data) {
        return sendResponse(res, {
            httpStatusCode: status.UNAUTHORIZED,
            success: false,
            message: 'Invalid or expired refresh token',
        });
    }

    const tokens = await AuthService.refreshTokens(verified.data);

    setAuthCookies(res, tokens);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: 'Tokens refreshed',
        data: tokens,
    });
});

const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.requestPasswordReset(email);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: result.message });
});

const confirmPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { email, token, password } = req.body;
    const result = await AuthService.confirmPasswordReset({ email, token, password });
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: result.message });
});



const googleLogin = catchAsync(async (req: Request, res: Response) => {
    const callbackPath = req.query.callbackURL || req.query.redirect || "/dashboard";
    const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodeURIComponent(callbackPath as string)}`;

    try {
        // Use better-auth's native signInSocial endpoint and forward its headers.
        const signInResponse = await auth.api.signInSocial({
            body: {
                provider: "google",
                callbackURL: callbackURL,
                errorCallbackURL: `${envVars.CLIENT_URL}/login?error=oauth_failed`,
            },
            asResponse: true,
        });

        const location = signInResponse.headers.get("location");

        signInResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") {
                res.append("set-cookie", value);
                return;
            }

            res.setHeader(key, value);
        });

        if (location) {
            return res.redirect(signInResponse.status === 302 || signInResponse.status === 303 ? location : location);
        }

        return res.redirect(`${envVars.CLIENT_URL}/login?error=oauth_init_failed`);
    } catch (error) {
        console.error("Google OAuth Error:", error);
        return res.redirect(`${envVars.CLIENT_URL}/login?error=oauth_failed`);
    }
})


const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = (req.query.redirect as string) || "/dashboard";
    const sessionToken = req.cookies["better-auth.session_token"];

    if (!sessionToken) {
        return res.redirect(`${envVars.CLIENT_URL}/login?error=session_missing`);
    }

    try {
        // Retrieve session from better-auth
        const session = await auth.api.getSession({
            headers: {
                Cookie: `better-auth.session_token=${sessionToken}`,
            },
        });

        if (!session?.user) {
            return res.redirect(`${envVars.CLIENT_URL}/login?error=user_not_found`);
        }

        // Create/update shop owner profile with complete data
        const result = await AuthService.googleLoginSuccessF(session);
        const { accessToken, refreshToken } = result;

        // Set auth cookies
        setAuthCookies(res, { accessToken, refreshToken, token: sessionToken });

        // Validate redirect path
        const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
        const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

        // Redirect to the frontend route with tokens.
        const frontendUrl = new URL(finalRedirectPath, envVars.CLIENT_URL || "http://localhost:3000");
        frontendUrl.searchParams.set("accessToken", accessToken);
        frontendUrl.searchParams.set("refreshToken", refreshToken);
        frontendUrl.searchParams.set("sessionToken", sessionToken);

        return res.redirect(frontendUrl.toString());
    } catch (error) {
        console.error("Google Login Success Error:", error);
        return res.redirect(`${envVars.CLIENT_URL}/login?error=auth_failed`);
    }
})


export const AuthController = {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    verifyEmailOtp,
    resendVerificationOtp,
    logout,
    refreshToken,
    requestPasswordReset,
    confirmPasswordReset,
    googleLogin,
    googleLoginSuccess,
};