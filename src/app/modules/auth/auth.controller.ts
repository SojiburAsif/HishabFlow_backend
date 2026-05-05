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



const googleLogin = catchAsync((req: Request, res: Response) => {
    // Check both callbackURL (new) and redirect (legacy) to maintain compatibility
    const callbackParam = req.query.callbackURL || req.query.redirect || "/dashboard";

    const encodedCallbackPath = encodeURIComponent(callbackParam as string);

    const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedCallbackPath}`;

    // Return a completely invisible HTML page that instantly initiates the Better Auth OAuth flow
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Redirecting...</title>
</head>
<body style="background: black; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 0; font-family: sans-serif;">
    <h2>Redirecting...</h2>
    <script>
        const callbackURL = "${callbackURL}";
        const betterAuthUrl = "${envVars.BETTER_AUTH_URL}";
        const signInEndpoint = betterAuthUrl + "/api/auth/sign-in/social"; 

        fetch(signInEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                provider: 'google',
                callbackURL: callbackURL
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.url) {
                window.location.replace(data.url);
            } else {
                window.location.replace("${envVars.CLIENT_URL}/login?error=oauth_init_failed");
            }
        })
        .catch(() => {
                window.location.replace("${envVars.CLIENT_URL}/login?error=oauth_network_failed");
        });
    </script>
</body>
</html>
`);
})


const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = req.query.redirect as string || "/dashboard";

    const sessionToken = req.cookies["better-auth.session_token"];

    if (!sessionToken) {
        return res.redirect(`${envVars.CLIENT_URL}/login?error=oauth_failed`);
    }

    const session = await auth.api.getSession({
        headers: {
            "Cookie": `better-auth.session_token=${sessionToken}`
        }
    })

    if (!session) {
        return res.redirect(`${envVars.CLIENT_URL}/login?error=no_session_found`);
    }


    if (session && !session.user) {
        return res.redirect(`${envVars.CLIENT_URL}/login?error=no_user_found`);
    }

    const result = await AuthService.googleLoginSuccessF(session);

    const { accessToken, refreshToken } = result;

    setAuthCookies(res, { accessToken, refreshToken });
    // ?redirect=//profile -> /profile
    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

    // Redirect to frontend google-success API route with tokens to establish local cookies!
    const frontendSafeUrl = new URL("/api/auth/google-success", envVars.CLIENT_URL);
    frontendSafeUrl.searchParams.set("accessToken", accessToken);
    frontendSafeUrl.searchParams.set("refreshToken", refreshToken);
    frontendSafeUrl.searchParams.set("sessionToken", sessionToken);
    frontendSafeUrl.searchParams.set("redirect", finalRedirectPath);

    res.redirect(frontendSafeUrl.toString());
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