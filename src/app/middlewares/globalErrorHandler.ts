/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Prisma } from "../../generated/prisma/client";
import z from "zod";

import AppError from "../errorHelpers/AppError";
import {
    handlePrismaClientKnownRequestError,
    handlePrismaClientUnknownError,
    handlePrismaClientValidationError,
    handlerPrismaClientInitializationError,
    handlerPrismaClientRustPanicError,
} from "../errorHelpers/handlePrismaErrors";
import { handleZodError } from "../errorHelpers/handleZodError";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import { envVars } from "../config/env";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (envVars.NODE_ENV === 'development') {
        console.log("Error from Global Error Handler", err);
    }

    let normalizedError: TErrorResponse = {
        success: false,
        statusCode: status.INTERNAL_SERVER_ERROR,
        message: "Internal Server Error",
        errorSources: [],
    };

    if (err instanceof z.ZodError) {
        normalizedError = handleZodError(err);
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        normalizedError = handlePrismaClientKnownRequestError(err);
    } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        normalizedError = handlePrismaClientUnknownError(err);
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        normalizedError = handlePrismaClientValidationError(err);
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        normalizedError = handlerPrismaClientInitializationError(err);
    } else if (err instanceof Prisma.PrismaClientRustPanicError) {
        normalizedError = handlerPrismaClientRustPanicError();
    } else if (err instanceof AppError) {
        normalizedError = {
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errorSources: [
                {
                    path: "Application",
                    message: err.message,
                },
            ],
        };
    } else if (err instanceof Error) {
        normalizedError = {
            success: false,
            statusCode: status.INTERNAL_SERVER_ERROR,
            message: err.message,
            errorSources: [
                {
                    path: "Unknown",
                    message: err.message,
                },
            ],
        };
    }


    const errorResponse: TErrorResponse = {
        success: false,
        statusCode: normalizedError.statusCode,
        message: normalizedError.message,
        errorSources: normalizedError.errorSources,
        error: envVars.NODE_ENV === 'development' ? err : undefined,
        stack: envVars.NODE_ENV === 'development' ? err?.stack : undefined,
    }

    res.status(normalizedError.statusCode || status.INTERNAL_SERVER_ERROR).json(errorResponse);
}