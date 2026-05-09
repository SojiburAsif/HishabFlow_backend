import dotenv from 'dotenv';
import status from 'http-status';
import AppError from '../errorHelpers/AppError';

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    CLIENT_URL: string;
    BASE_API_URL?: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    EMAIL_SENDER: {
        SMTP_HOST: string;
        SMTP_PORT: string;
        SMTP_USER: string;
        SMTP_PASS: string;
        SMTP_FROM: string;
    };
    STRIPE: {
        STRIPE_SECRET_KEY?: string;
        STRIPE_WEBHOOK_SECRET?: string;
    }
}


const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'PORT',
        'DATABASE_URL',
        'BETTER_AUTH_SECRET',
        'BETTER_AUTH_URL',
        'EMAIL_SENDER_SMTP_HOST',
        'EMAIL_SENDER_SMTP_PORT',
        'EMAIL_SENDER_SMTP_USER',
        'EMAIL_SENDER_SMTP_PASS',
        'EMAIL_SENDER_SMTP_FROM',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
    ]

    requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
            // throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
        }
    })

    return {
        NODE_ENV: process.env.NODE_ENV ?? 'development',
        PORT: process.env.PORT as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
        CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
        BASE_API_URL: process.env.BASE_API_URL ?? 'http://localhost:5000',
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? `${process.env.BETTER_AUTH_SECRET}-access`,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? `${process.env.BETTER_AUTH_SECRET}-refresh`,
        ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '1d',
        REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
        BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN ?? '1d',
        BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE ?? '12h',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        EMAIL_SENDER: {
            SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
            SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
            SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
            SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
            SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
        },
        STRIPE: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        }
    }
}

export const envVars = loadEnvVariables();