/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import nodemailer from "nodemailer";

import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import { SendEmailOptions } from "../interfaces/EmailSendInterface";

const transporter = nodemailer.createTransport({
    host: envVars.EMAIL_SENDER.SMTP_HOST,
    secure: Number(envVars.EMAIL_SENDER.SMTP_PORT) === 465,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT)
});

const EMAIL_PURPLE = "#7c3aed";
const EMAIL_BLACK = "#09090b";

/**
 * OTP Verification Template
 */
const generateOTPEmailHTML = (templateData: any): string => {
    const { name = "User", otp } = templateData;
    const currentYear = new Date().getFullYear();

    return `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #f3f4f6;">
            <div style="background-color: ${EMAIL_BLACK}; padding: 35px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px;">Shop<span style="color: ${EMAIL_PURPLE};">Flow</span></h1>
            </div>
            <div style="padding: 40px;">
                <h2 style="font-size: 20px; font-weight: 700; color: ${EMAIL_BLACK}; margin-bottom: 10px;">Verify your identity</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 25px;">Hi ${name}, use the security code below to complete your verification. This code is valid for 2 minutes.</p>
                
                <div style="background-color: #fbfbfe; border: 1px dashed ${EMAIL_PURPLE}; padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: ${EMAIL_PURPLE}; font-family: monospace;">${otp}</span>
                </div>

                <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; margin-top: 30px; text-align: center;">
                    If you didn't request this code, please ignore this email or contact security if you're concerned.
                </p>
            </div>
            <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-widest; color: #9ca3af; margin: 0;">&copy; ${currentYear} ShopFlow Inc. All rights reserved.</p>
            </div>
        </div>
    </div>`;
};

/**
 * Subscription / Invoice Email Template
 */
const generateSubscriptionEmailHTML = (templateData: any): string => {
    const { name = "Shop Owner", shopName, planName, amount, transactionId, endDate } = templateData;
    const currentYear = new Date().getFullYear();

    return `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: sans-serif;">
        <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: ${EMAIL_BLACK}; padding: 30px; text-align: center;">
                <h1 style="color: white; font-size: 22px; margin: 0;">Shop<span style="color: ${EMAIL_PURPLE};">Flow</span></h1>
            </div>
            <div style="padding: 40px;">
                <h2 style="margin: 0 0 10px; font-size: 24px; color: ${EMAIL_BLACK};">Payment Confirmed</h2>
                <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Hi ${name}, your shop <strong>${shopName}</strong> is now boosted with ${planName} features.</p>
                
                <div style="background: #fafafa; border-radius: 20px; padding: 20px; border: 1px solid #f0f0f0;">
                    <table style="width: 100%; font-size: 14px; color: #444;">
                        <tr><td style="padding: 10px 0; color: #888;">Plan</td><td style="text-align: right; font-weight: bold;">${planName}</td></tr>
                        <tr><td style="padding: 10px 0; color: #888;">Transaction</td><td style="text-align: right; font-family: monospace;">${transactionId}</td></tr>
                        <tr><td style="padding: 10px 0; color: #888;">Valid Until</td><td style="text-align: right;">${new Date(endDate).toLocaleDateString()}</td></tr>
                        <tr style="font-size: 18px; color: ${EMAIL_BLACK};"><td style="padding: 20px 0 0; font-weight: 800;">Amount Paid</td><td style="padding: 20px 0 0; text-align: right; font-weight: 800;">৳${amount}</td></tr>
                    </table>
                </div>

                <div style="margin-top: 35px; text-align: center;">
                    <a href="#" style="background: ${EMAIL_PURPLE}; color: white; padding: 16px 35px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 15px; display: inline-block;">Go to Dashboard</a>
                </div>
            </div>
            <div style="padding: 20px; text-align: center; color: #bbb; font-size: 11px;">
                ShopFlow HQ, Dhaka, Bangladesh <br> &copy; ${currentYear} ShopFlow
            </div>
        </div>
    </div>`;
};

/**
 * Verification Email Template
 */
const generateVerificationEmailHTML = (templateData: any): string => {
    const { name = "User", verificationUrl } = templateData;
    return `
    <div style="padding: 40px; background: #ffffff; text-align: center; font-family: sans-serif;">
        <h1 style="color: ${EMAIL_BLACK}; font-weight: 900;">Shop<span style="color: ${EMAIL_PURPLE};">Flow</span></h1>
        <div style="max-width: 400px; margin: 40px auto; text-align: left;">
            <h2 style="font-size: 24px; color: ${EMAIL_BLACK};">Welcome, ${name}!</h2>
            <p style="color: #666; line-height: 1.6;">Click the button below to verify your email and start building your empire.</p>
            <a href="${verificationUrl}" style="display: block; background: ${EMAIL_PURPLE}; color: #fff; padding: 18px; text-decoration: none; border-radius: 12px; font-weight: 800; text-align: center; margin-top: 30px;">Verify Account</a>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">If the button fails, copy this: ${verificationUrl}</p>
        </div>
    </div>`;
};

const generateNotificationEmailHTML = (templateData: any): string => {
    const { title, message, ctaLabel, ctaUrl } = templateData;
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f7f7f2; color: #1f2937; }
        .wrap { padding: 32px 16px; }
        .card { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 16px 35px rgba(15, 23, 42, 0.07); }
        .head { padding: 26px 28px; background: linear-gradient(135deg, #0b3b2e 0%, #14532d 100%); color: #fff; }
        .body { padding: 28px; }
        .body h2 { margin: 0 0 12px; font-size: 22px; }
        .body p { margin: 0 0 14px; line-height: 1.7; color: #374151; }
        .cta { display: inline-block; margin-top: 14px; padding: 12px 18px; border-radius: 10px; background: #14532d; color: #fff; text-decoration: none; font-weight: 700; }
        .footer { padding: 18px 28px 28px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <div class="head"><strong>ServiZen</strong></div>
            <div class="body">
                <h2>${title}</h2>
                <p>${message.replace(/\n/g, "<br />")}</p>
                ${ctaUrl ? `<a class="cta" href="${ctaUrl}">${ctaLabel || "Open"}</a>` : ""}
            </div>
            <div class="footer">&copy; ${currentYear} ServiZen</div>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate HTML content for email templates
 */
const generateEmailHTML = (templateName: string, templateData: any): string => {
    switch (templateName) {
        case 'otp':
            return generateOTPEmailHTML(templateData);
        case 'subscription':
            return generateSubscriptionEmailHTML(templateData);
        case 'verification':
            return generateVerificationEmailHTML(templateData);
        case 'notification':
            return generateNotificationEmailHTML(templateData);
        default:
            throw new AppError(status.BAD_REQUEST, `Email template '${templateName}' not found`);
    }
};

export const sendEmail = async ({ subject, templateData, templateName, to, attachments }: SendEmailOptions) => {
    try {
        const html = generateEmailHTML(templateName, templateData);

        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            }))
        });

        console.log(`Email sent to ${to} : ${info.messageId}`);
    } catch (error: any) {
        console.log("Email Sending Error", error.message);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
};