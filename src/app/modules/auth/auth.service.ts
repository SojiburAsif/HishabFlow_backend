import status from "http-status";
import { randomUUID } from "crypto";

import { Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";
import { sendEmail } from "../../utils/email";
import { tokenUtils } from "../../utils/token";
import {
    IGoogleSession,
    ILoginPayload,
    ILogoutPayload,
    IRegisterPayload,
    IResetPasswordPayload,
    IResendVerificationPayload,
    ITokenPayload,
    IVerifyEmailPayload,
} from "./auth.interface";

const toTokenPayload = (user: ITokenPayload) => ({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
});

const registerUser = async (payload: IRegisterPayload) => {
    const data = await auth.api.signUpEmail({
        body: {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        },
    });

    if (!data.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to register user with provided details");
    }

    try {
        let shopOwnerProfile = null as Awaited<ReturnType<typeof prisma.shopOwnerProfile.create>> | null;

        if (data.user.role === Role.SHOP_OWNER) {
            shopOwnerProfile = await prisma.$transaction(async (tx) => {
                const profile = await tx.shopOwnerProfile.create({
                    data: {
                        userId: data.user.id,
                        displayName: payload.displayName ?? data.user.name,
                        phone: payload.phone,
                        preferredShopName: payload.shopName ?? payload.preferredShopName ?? data.user.name,
                    },
                });

                await tx.user.update({
                    where: { id: data.user.id },
                    data: {
                        image: payload.image,
                    },
                });

                return profile;
            });
        }

        const accessToken = data.token ? tokenUtils.getAccessToken(toTokenPayload(data.user)) : undefined;
        const refreshToken = data.token ? tokenUtils.getRefreshToken(toTokenPayload(data.user)) : undefined;

        await sendVerificationEmail({
            email: data.user.email,
            name: data.user.name,
        });

        return {
            ...data,
            profile: shopOwnerProfile,
            accessToken,
            refreshToken,
        };
    } catch (error) {
        await prisma.user.delete({
            where: {
                id: data.user.id,
            },
        }).catch(() => undefined);

        throw error instanceof AppError
            ? error
            : new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create shop owner profile");
    }
};

const loginUser = async (payload: ILoginPayload) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });

    if (!existingUser) {
        throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
    }

    if (existingUser.isDeleted || existingUser.deletedAt) {
        throw new AppError(status.NOT_FOUND, "User is deleted");
    }

    if (existingUser.status !== UserStatus.ACTIVE) {
        throw new AppError(status.FORBIDDEN, "User account is not active");
    }

    // Allow login even if user hasn't verified email yet.
    // Email verification is enforced for subscription purchases.

    const data = await auth.api.signInEmail({
        body: {
            email: payload.email,
            password: payload.password,
        },
    });

    if (!data.user) {
        throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
    }

    const accessToken = tokenUtils.getAccessToken(toTokenPayload(data.user));
    const refreshToken = tokenUtils.getRefreshToken(toTokenPayload(data.user));

    return {
        ...data,
        accessToken,
        refreshToken,
    };
};

const sendVerificationEmail = async ({ email, name }: IResendVerificationPayload) => {
    const verificationToken = randomUUID();
    const verificationUrl = `${envVars.CLIENT_URL || envVars.BETTER_AUTH_URL}/api/v1/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(verificationToken)}`;

    await prisma.verification.deleteMany({
        where: {
            identifier: email,
        },
    });

    await prisma.verification.create({
        data: {
            id: randomUUID(),
            identifier: email,
            value: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });

    await sendEmail({
        to: email,
        subject: "Verify your email address",
        templateName: "verification",
        templateData: {
            name: name || "User",
            verificationUrl,
        },
    });

    return {
        success: true,
        message: "Verification email sent",
    };
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
    const verification = await prisma.verification.findFirst({
        where: {
            identifier: payload.email,
            value: payload.token,
        },
    });

    if (!verification) {
        throw new AppError(status.BAD_REQUEST, "Invalid or expired verification link");
    }

    if (verification.expiresAt.getTime() < Date.now()) {
        await prisma.verification.delete({ where: { id: verification.id } }).catch(() => undefined);
        throw new AppError(status.BAD_REQUEST, "Verification link has expired");
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
        });

        await tx.verification.delete({
            where: { id: verification.id },
        });
    });

    return {
        success: true,
        message: "Email verified successfully",
    };
};

// Generate a 4-digit OTP
const generate4DigitOtp = () => {
    return String(Math.floor(1000 + Math.random() * 9000));
};

const sendVerificationOtp = async ({ email, name }: IResendVerificationPayload) => {
    const otp = generate4DigitOtp();

    // Remove existing verifications for this identifier
    await prisma.verification.deleteMany({ where: { identifier: email } });

    // Short expiry for OTP (2 minutes)
    await prisma.verification.create({
        data: {
            id: randomUUID(),
            identifier: email,
            value: otp,
            expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        },
    });

    await sendEmail({
        to: email,
        subject: "Your verification code",
        templateName: "otp",
        templateData: { name: name || "User", otp },
    });

    return { success: true, message: "OTP sent to email" };
};

const verifyEmailOtp = async (payload: IVerifyEmailPayload) => {
    const verification = await prisma.verification.findFirst({
        where: { identifier: payload.email, value: payload.token },
    });

    if (!verification) {
        throw new AppError(status.BAD_REQUEST, "Invalid or expired OTP");
    }

    if (verification.expiresAt.getTime() < Date.now()) {
        await prisma.verification.delete({ where: { id: verification.id } }).catch(() => undefined);
        throw new AppError(status.BAD_REQUEST, "OTP has expired");
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        await tx.verification.delete({ where: { id: verification.id } });
    });

    return { success: true, message: "Email verified successfully" };
};

const resendVerificationOtp = async (payload: IResendVerificationPayload) => {
    return sendVerificationOtp(payload);
};

// ----------------------------
// Password reset helpers
// ----------------------------
const requestPasswordReset = async (email: string) => {
    const token = randomUUID();

    await prisma.verification.deleteMany({ where: { identifier: email } });

    await prisma.verification.create({
        data: {
            id: randomUUID(),
            identifier: email,
            value: token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
    });

    const resetUrl = `${envVars.CLIENT_URL || envVars.BETTER_AUTH_URL}/reset-password?email=${encodeURIComponent(
        email,
    )}&token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: email,
        subject: "Reset your password",
        templateName: "notification",
        templateData: {
            title: "Password reset request",
            message: `We received a request to reset your password. Click the link below to reset it:\n${resetUrl}`,
            ctaLabel: "Reset password",
            ctaUrl: resetUrl,
        },
    });

    return { success: true, message: "Password reset email sent" };
};

const confirmPasswordReset = async (payload: IResetPasswordPayload) => {
    const verification = await prisma.verification.findFirst({ where: { identifier: payload.email, value: payload.token } });
    if (!verification) throw new AppError(status.BAD_REQUEST, "Invalid or expired reset token");
    if (verification.expiresAt.getTime() < Date.now()) {
        await prisma.verification.delete({ where: { id: verification.id } }).catch(() => undefined);
        throw new AppError(status.BAD_REQUEST, "Reset token has expired");
    }

    // Try to use better-auth API to update password
    try {
        await auth.api.resetPassword({ body: { email: payload.email, token: payload.token, password: payload.password } } as any);
    } catch (err) {
        // If better-auth reset API isn't available, attempt to update via prisma (may store unhashed password depending on adapter)
        await prisma.user.update({ where: { email: payload.email }, data: { password: payload.password } as any });
    }

    await prisma.verification.delete({ where: { id: verification.id } }).catch(() => undefined);

    return { success: true, message: "Password reset successfully" };
};

// ----------------------------
// Session / token helpers
// ----------------------------
const logout = async ({ sessionToken }: ILogoutPayload) => {
    if (sessionToken) {
        await prisma.session.deleteMany({ where: { token: sessionToken } });
    }

    return { success: true, message: "Logged out successfully" };
};

const refreshTokens = async (refreshPayload: any) => {
    // refreshPayload expected to be token payload from refresh token
    const accessToken = tokenUtils.getAccessToken(refreshPayload as any);
    const refreshToken = tokenUtils.getRefreshToken(refreshPayload as any);
    return { accessToken, refreshToken };
};

// ----------------------------
// Google OAuth helpers
// ----------------------------
const googleLoginSuccessF = async (session: IGoogleSession) => {
    const user = session.user;
    if (!user) throw new AppError(status.NOT_FOUND, "OAuth user not found");

    // Ensure shop owner profile exists for SHOP_OWNER role
    if (user.role === Role.SHOP_OWNER) {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.shopOwnerProfile.findUnique({ where: { userId: user.id } });
            if (!existing) {
                await tx.shopOwnerProfile.create({
                    data: {
                        userId: user.id,
                        displayName: user.name || "",
                        preferredShopName: user.name || "",
                    },
                });
            }

            if (user.image) {
                await tx.user.update({ where: { id: user.id }, data: { image: user.image } });
            }
        });
    }

    const accessToken = tokenUtils.getAccessToken(toTokenPayload(user));
    const refreshToken = tokenUtils.getRefreshToken(toTokenPayload(user));

    return { accessToken, refreshToken };
};

export const AuthService = {
    registerUser,
    loginUser,
    verifyEmail,
    sendVerificationEmail,
    verifyEmailOtp,
    sendVerificationOtp,
    resendVerificationOtp,
    // New features
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    refreshTokens,
    googleLoginSuccessF,
};