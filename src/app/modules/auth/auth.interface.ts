export interface IRegisterPayload {
    name: string;
    email: string;
    password: string;
    image?: string;
    displayName?: string;
    phone?: string;
    shopName?: string;
    shopImage?: string;
    preferredShopName?: string;
}

export interface ILoginPayload {
    email: string;
    password: string;
}

export interface IVerifyEmailPayload {
    email: string;
    token: string;
}

export interface IResendVerificationPayload {
    email: string;
    name?: string;
}

export interface IResetPasswordPayload {
    email: string;
    token: string;
    password: string;
}

export interface ITokenPayload {
    id: string;
    role: string;
    name: string;
    email: string;
    status: string;
    isDeleted: boolean;
    emailVerified: boolean;
}

export interface ILogoutPayload {
    sessionToken?: string;
}

export interface IGoogleSessionUser {
    id: string;
    role: string;
    name: string;
    email: string;
    image?: string | null;
    status: string;
    isDeleted: boolean;
    emailVerified: boolean;
}

export interface IGoogleSession {
    user?: IGoogleSessionUser | null;
}