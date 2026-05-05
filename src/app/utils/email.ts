/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import nodemailer from "nodemailer";

import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import { SendEmailOptions } from "../interfaces/EmailSendInterface";

const transporter = nodemailer.createTransport({
    host : envVars.EMAIL_SENDER.SMTP_HOST,
    secure: Number(envVars.EMAIL_SENDER.SMTP_PORT) === 465,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT)
});

/**
 * Generate OTP email HTML template
 */
const generateOTPEmailHTML = (templateData: any): string => {
    const { name = "User", otp } = templateData;
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>ServiZen OTP Verification</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #f3f7f4; font-family: Arial, Helvetica, sans-serif; color: #111111; }
        .wrapper { width: 100%; padding: 32px 16px; background: radial-gradient(circle at top right, #d9f7e3 0%, #f3f7f4 45%, #edf3ee 100%); }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d2e9d8; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
        .header { padding: 26px 28px; background: linear-gradient(135deg, #0f6d3d 0%, #0b2b1d 100%); color: #ffffff; text-align: center; }
        .brand { margin: 0; font-size: 30px; line-height: 1; font-weight: 700; letter-spacing: 0.5px; }
        .brand-sub { margin: 10px 0 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.25px; }
        .content { padding: 30px 28px 24px; }
        .title { margin: 0 0 14px; font-size: 24px; color: #0f6d3d; line-height: 1.3; }
        .text { margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #1f2a21; }
        .otp-wrap { margin: 24px 0; text-align: center; }
        .otp { display: inline-block; padding: 14px 26px; border-radius: 12px; background: #0a0a0a; color: #6dffaf; font-size: 34px; font-weight: 800; letter-spacing: 8px; border: 1px solid #1f7d4a; }
        .note { margin: 0; padding: 14px 16px; border-radius: 12px; background: #f0fbf4; border: 1px solid #c6ebd2; color: #214130; font-size: 13px; line-height: 1.6; }
        .footer { padding: 20px 28px 28px; font-size: 12px; line-height: 1.6; color: #4a5a4f; text-align: center; border-top: 1px dashed #d9eadd; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1 class="brand">ServiZen</h1>
                <p class="brand-sub">Secure Access Verification</p>
            </div>
            <div class="content">
                <h2 class="title">Your One-Time Password</h2>
                <p class="text">Hi ${name},</p>
                <p class="text">Use the OTP below to complete your verification on ServiZen. For your security, this code will expire in 2 minutes.</p>
                <div class="otp-wrap">
                    <div class="otp">${otp}</div>
                </div>
                <p class="note">If you did not request this code, please ignore this email. Never share your OTP with anyone.</p>
            </div>
            <div class="footer">
                This is an automated message from ServiZen. Please do not reply to this email.<br />
                &copy; ${currentYear} ServiZen. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate Subscription / Invoice email HTML template
 */
const generateSubscriptionEmailHTML = (templateData: any): string => {
    const { name = "Shop Owner", shopName, planName, amount, transactionId, endDate } = templateData;
    const currentYear = new Date().getFullYear();
    const clientUrl = envVars.CLIENT_URL || envVars.BETTER_AUTH_URL || "#";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Subscription Confirmed</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #f3f7f4; font-family: Arial, Helvetica, sans-serif; color: #111111; }
        .wrapper { width: 100%; padding: 32px 16px; background: radial-gradient(circle at top right, #d9f7e3 0%, #f3f7f4 45%, #edf3ee 100%); }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d2e9d8; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
        .header { padding: 26px 28px; background: linear-gradient(135deg, #0f6d3d 0%, #0b2b1d 100%); color: #ffffff; text-align: center; }
        .brand { margin: 0; font-size: 30px; line-height: 1; font-weight: 700; letter-spacing: 0.5px; }
        .brand-sub { margin: 10px 0 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.25px; }
        .content { padding: 30px 28px 24px; }
        .title { margin: 0 0 14px; font-size: 24px; color: #0f6d3d; line-height: 1.3; }
        .text { margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #1f2a21; }
        .receipt-box { margin: 24px 0; border-radius: 12px; background: #f8fbf9; border: 1px solid #c6ebd2; overflow: hidden; }
        .receipt-row { display: flex; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #e2f0e6; font-size: 14px; }
        .receipt-row:last-child { border-bottom: none; background: #eaf5ee; font-weight: bold; }
        .label { color: #4a5a4f; }
        .value { color: #0b2b1d; text-align: right; }
        .btn-wrap { text-align: center; margin: 24px 0 10px; }
        .btn { display: inline-block; padding: 12px 28px; background: #0f6d3d; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; }
        .footer { padding: 20px 28px 28px; font-size: 12px; line-height: 1.6; color: #4a5a4f; text-align: center; border-top: 1px dashed #d9eadd; }
        @media (max-width: 600px) {
            .wrapper { padding: 16px 10px; }
            .header, .content, .footer { padding-left: 18px; padding-right: 18px; }
            .receipt-row { flex-direction: column; gap: 4px; }
            .value { text-align: left; font-weight: bold; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1 class="brand">ServiZen</h1>
                <p class="brand-sub">Payment Receipt & Confirmation</p>
            </div>
            <div class="content">
                <h2 class="title">Welcome, ${name}!</h2>
                <p class="text">Thank you for your purchase. Your shop <strong>${shopName}</strong> is now active and ready to use.</p>
                
                <div class="receipt-box">
                    <div class="receipt-row">
                        <span class="label">Shop Name:</span>
                        <span class="value">${shopName}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Plan:</span>
                        <span class="value">${planName}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">${transactionId}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Valid Until:</span>
                        <span class="value">${new Date(endDate).toLocaleDateString()}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Amount Paid:</span>
                        <span class="value">৳${amount}</span>
                    </div>
                </div>

                <p class="text">You can now log in to your dashboard and start managing your shop.</p>
                
                <div class="btn-wrap">
                    <a href="${clientUrl}" class="btn">Go to Dashboard</a>
                </div>
            </div>
            <div class="footer">
                If you have any questions, please reply to this email.<br />
                &copy; ${currentYear} ServiZen. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`;
};

const generateVerificationEmailHTML = (templateData: any): string => {
    const { name = "User", verificationUrl } = templateData;
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #eef4ff; font-family: Arial, Helvetica, sans-serif; color: #111827; }
        .wrap { width: 100%; padding: 32px 16px; }
        .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #dbe4ff; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
        .hero { padding: 30px 28px; background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%); color: #fff; }
        .hero h1 { margin: 0; font-size: 28px; }
        .hero p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px 28px; }
        .title { margin: 0 0 12px; font-size: 22px; color: #0f172a; }
        .text { margin: 0 0 14px; line-height: 1.7; color: #334155; }
        .btn { display: inline-block; margin-top: 18px; padding: 12px 20px; border-radius: 10px; background: #1d4ed8; color: #fff; text-decoration: none; font-weight: 700; }
        .link { word-break: break-all; color: #1d4ed8; }
        .footer { padding: 18px 28px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <div class="hero">
                <h1>Verify your email</h1>
                <p>Complete account setup for ServiZen</p>
            </div>
            <div class="content">
                <h2 class="title">Hello ${name},</h2>
                <p class="text">Your account has been created. Click the button below to verify your email address and activate access.</p>
                <a class="btn" href="${verificationUrl}">Verify Email</a>
                <p class="text" style="margin-top: 16px;">If the button does not work, copy and paste this URL into your browser:</p>
                <p class="text link">${verificationUrl}</p>
            </div>
            <div class="footer">This verification link is time-limited for security.<br />&copy; ${currentYear} ServiZen</div>
        </div>
    </div>
</body>
</html>`;
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

export const sendEmail = async ({subject, templateData, templateName, to, attachments} : SendEmailOptions) => {
    try {
        const html = generateEmailHTML(templateName, templateData);

        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to : to,
            subject : subject,
            html : html,
            attachments: attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            }))
        });

        console.log(`Email sent to ${to} : ${info.messageId}`);
    } catch (error : any) {
        console.log("Email Sending Error", error.message);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
};