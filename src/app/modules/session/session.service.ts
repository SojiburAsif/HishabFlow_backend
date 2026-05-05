import status from "http-status";

import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { Role } from "../../../generated/prisma/enums";
import { IAuthenticatedUser, ISessionItem } from "./session.interface";

const sessionSelect = {
    id: true,
    token: true,
    expiresAt: true,
    createdAt: true,
    updatedAt: true,
    ipAddress: true,
    userAgent: true,
    userId: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            emailVerified: true,
            status: true,
        },
    },
} as const;

const requireAdmin = (user: IAuthenticatedUser) => {
    if (user.role !== Role.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only super admin can access all sessions");
    }
};

const getMySessions = async (user: IAuthenticatedUser) => {
    const sessions = await prisma.session.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
        select: sessionSelect,
    });

    return sessions as ISessionItem[];
};

const getAllSessions = async (user: IAuthenticatedUser) => {
    requireAdmin(user);

    const sessions = await prisma.session.findMany({
        orderBy: { createdAt: "desc" },
        select: sessionSelect,
    });

    return sessions as ISessionItem[];
};

const deleteSessionById = async (user: IAuthenticatedUser, sessionId: string) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        throw new AppError(status.NOT_FOUND, "Session not found");
    }

    if (user.role !== Role.SUPER_ADMIN && session.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "You do not have permission to delete this session");
    }

    await prisma.session.delete({
        where: { id: sessionId },
    });

    return {
        success: true,
        message: "Session deleted successfully",
    };
};

const deleteCurrentSession = async (sessionToken?: string) => {
    if (!sessionToken) {
        return {
            success: true,
            message: "Session already cleared",
        };
    }

    await prisma.session.deleteMany({
        where: { token: sessionToken },
    });

    return {
        success: true,
        message: "Current session deleted successfully",
    };
};

export const SessionService = {
    getMySessions,
    getAllSessions,
    deleteSessionById,
    deleteCurrentSession,
};
