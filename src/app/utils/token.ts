import { Response } from "express";
import { JwtPayload, SignOptions } from "jsonwebtoken";


import { envVars } from "../config/env";
import { jwtUtils } from "./jwt";
import { CookieUtils } from "./cookie";

type CookieSameSite = "none" | "lax";

const isProduction = envVars.NODE_ENV === "production";
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as CookieSameSite,
    path: "/",
};

const getCookieMaxAge = (expiresIn: string) => {
    const match = expiresIn.match(/^(\d+)(ms|s|m|h|d|w)$/);

    if (!match) {
        return undefined;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const unitToMs: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    };

    return amount * unitToMs[unit];
};


//Creating access token
const getAccessToken = (payload: JwtPayload) => {
    const accessToken = jwtUtils.createToken(
        payload,
        envVars.ACCESS_TOKEN_SECRET,
        { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
    );

    return accessToken;
}

const getRefreshToken = (payload: JwtPayload) => {
    const refreshToken = jwtUtils.createToken(
        payload,
        envVars.REFRESH_TOKEN_SECRET,
        { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN } as SignOptions
    );
    return refreshToken;
}


const setAccessTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, 'accessToken', token, {
        ...cookieOptions,
        maxAge: getCookieMaxAge(envVars.ACCESS_TOKEN_EXPIRES_IN),
    });
}

const setRefreshTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, 'refreshToken', token, {
        ...cookieOptions,
        maxAge: getCookieMaxAge(envVars.REFRESH_TOKEN_EXPIRES_IN),
    });
}

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, "better-auth.session_token", token, {
        ...cookieOptions,
        maxAge: getCookieMaxAge(envVars.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN),
    });
}



export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie,
}