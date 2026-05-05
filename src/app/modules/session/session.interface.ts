import { Role } from "../../../generated/prisma/enums";

export interface IAuthenticatedUser {
    userId: string;
    role: Role;
    email: string;
    shopId?: string;
    emailVerified?: boolean;
}

export interface ISessionSelectUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    image: string | null;
    emailVerified: boolean;
    status: string;
}

export interface ISessionItem {
    id: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
    user: ISessionSelectUser;
}
