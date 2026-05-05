import status from "http-status";
import type Stripe from "stripe";

import AppError from "../../errorHelpers/AppError";
import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";

interface StripeEvent {
    id: string;
    type: string;
    data: {
        object: any;
    };
}

interface IInitiatePaymentPayload {
    planId: string;
    amount: number;
    purpose: string;
}

interface IConfirmPaymentPayload {
    paymentReference: string;
    planId: string;
}

const initiatePayment = async (payload: IInitiatePaymentPayload, shopId: string) => {
    try {
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: payload.planId },
        });

        if (!plan) {
            throw new AppError(status.NOT_FOUND, "Subscription plan not found");
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: plan.currencyCode.toLowerCase(),
                        product_data: {
                            name: plan.name,
                            description: plan.code,
                        },
                        unit_amount: Math.round(plan.price.toNumber() * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${envVars.BETTER_AUTH_URL}/api/v1/payments/cancel`,
            metadata: {
                shopId: shopId,
                planId: payload.planId,
            },
        });

        return {
            success: true,
            paymentRequired: true,
            checkoutUrl: session.url,
            sessionId: session.id,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        };
    } catch (error) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create Stripe session");
    }
};

const confirmPayment = async (payload: IConfirmPaymentPayload) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(payload.paymentReference);

        if (session.payment_status !== "paid") {
            throw new AppError(status.BAD_REQUEST, "Payment not completed");
        }

        const { shopId, planId } = session.metadata as {
            shopId: string;
            planId: string;
        };

        // Create or update subscription
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            throw new AppError(status.NOT_FOUND, "Plan not found");
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const subscription = await prisma.shopSubscription.create({
            data: {
                shopId,
                planId,
                transactionId: session.payment_intent as string,
                stripeSessionId: session.id,
                amountPaid: new Prisma.Decimal(session.amount_total! / 100),
                startsAt: now,
                endsAt: endsAt,
                status: "ACTIVE",
                autoRenew: true,
                note: `Stripe payment via ${session.id}`,
            },
        });

        // Update shop subscription status
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                subscriptionStatus: "ACTIVE",
                currentPlanId: planId,
                subscriptionEndsAt: endsAt,
                isDashboardLocked: false,
            },
        });

        return {
            success: true,
            subscription,
            message: "Payment confirmed and subscription created",
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Payment confirmation failed");
    }
};


const markBookingAsPaidFromSession = async (session: any, eventId: string) => {
    try {
        const metadata = session.metadata as Record<string, string | undefined>;
        
        // Check if this is a shop creation payment
        if (metadata?.type === "shop_creation" && metadata?.userId && !metadata?.shopId) {
            return await handleShopCreationPayment(session, eventId, metadata);
        }

        // Existing shop subscription payment
        const { shopId, planId } = metadata as { shopId: string; planId: string };

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return { success: false, message: "Plan not found" };
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        // Check if subscription already exists with this stripeSessionId
        const existing = await prisma.shopSubscription.findFirst({
            where: { stripeSessionId: session.id },
        });

        let subscription;
        if (existing) {
            subscription = await prisma.shopSubscription.update({
                where: { id: existing.id },
                data: {
                    stripeEventId: eventId,
                    status: "ACTIVE" as const,
                },
            });
        } else {
            subscription = await prisma.shopSubscription.create({
                data: {
                    shopId,
                    planId,
                    stripeSessionId: session.id,
                    transactionId: session.payment_intent as string,
                    stripeEventId: eventId,
                    amountPaid: new Prisma.Decimal((session.amount_total || 0) / 100),
                    startsAt: now,
                    endsAt: endsAt,
                    status: "ACTIVE" as const,
                    autoRenew: true,
                    note: `Webhook processed: ${eventId}`,
                },
            });
        }

        // Update shop
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                subscriptionStatus: "ACTIVE",
                currentPlanId: planId,
                subscriptionEndsAt: endsAt,
                isDashboardLocked: false,
            },
        });

        return { success: true, subscription };
    } catch (error) {
        console.error("Error marking payment as paid from session:", error);
        return { success: false, message: String(error) };
    }
};

const handleShopCreationPayment = async (session: any, eventId: string, metadata: Record<string, string | undefined>) => {
    try {
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: metadata.planId! },
        });

        if (!plan) {
            return { success: false, message: "Plan not found" };
        }

        const ownerProfile = await prisma.shopOwnerProfile.findUnique({
            where: { userId: metadata.userId! },
            include: { shop: true },
        });

        if (!ownerProfile) {
            return { success: false, message: "Shop owner profile not found" };
        }

        if (ownerProfile.shop) {
            return { success: false, message: "This owner already has a shop" };
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const normalizeSlug = (value: string) =>
            value
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 80) || `shop-${Date.now()}`;

        const result = await prisma.$transaction(async (tx) => {
            const shop = await tx.shop.create({
                data: {
                    ownerProfileId: ownerProfile.id,
                    shopName: metadata.shopName!,
                    image: metadata.image || undefined,
                    slug: normalizeSlug(metadata.shopName!),
                    description: metadata.description || undefined,
                    status: "ACTIVE" as const,
                    subscriptionStatus: "ACTIVE" as const,
                    subscriptionStartsAt: now,
                    subscriptionEndsAt: endsAt,
                    currentPlanId: plan.id,
                    isDashboardLocked: false,
                },
            });

            const subscription = await tx.shopSubscription.create({
                data: {
                    shopId: shop.id,
                    planId: plan.id,
                    stripeSessionId: session.id,
                    transactionId: session.payment_intent as string,
                    stripeEventId: eventId,
                    amountPaid: new Prisma.Decimal((session.amount_total || 0) / 100),
                    startsAt: now,
                    endsAt: endsAt,
                    status: "ACTIVE" as const,
                    autoRenew: true,
                    note: `Shop created via payment: ${eventId}`,
                },
            });

            await tx.shopOwnerProfile.update({
                where: { id: ownerProfile.id },
                data: {
                    preferredShopName: metadata.shopName!,
                    onboardingCompleted: true,
                },
            });

            return { shop, subscription };
        });

        return { success: true, ...result };
    } catch (error) {
        console.error("Error handling shop creation payment:", error);
        return { success: false, message: String(error) };
    }
};

const markBookingAsPaidByMetadata = async (
    metadata: Record<string, string> | undefined,
    eventId: string,
    paymentIntent: Prisma.InputJsonValue,
) => {
    try {
        if (!metadata?.shopId || !metadata?.planId) {
            return { success: false, message: "Missing metadata" };
        }

        const { shopId, planId } = metadata;

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return { success: false, message: "Plan not found" };
        }

        const now = new Date();
        const endsAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const subscription = await prisma.shopSubscription.create({
            data: {
                shopId,
                planId,
                stripeEventId: eventId,
                transactionId: eventId,
                amountPaid: new Prisma.Decimal(plan.price),
                startsAt: now,
                endsAt: endsAt,
                status: "ACTIVE",
                autoRenew: true,
                note: `Payment intent webhook: ${eventId}`,
            },
        });

        await prisma.shop.update({
            where: { id: shopId },
            data: {
                subscriptionStatus: "ACTIVE",
                currentPlanId: planId,
                subscriptionEndsAt: endsAt,
                isDashboardLocked: false,
            },
        });

        return { success: true, subscription };
    } catch (error) {
        console.error("Error marking payment as paid by metadata:", error);
        return { success: false, message: String(error) };
    }
};

const handlerStripeWebhookEvent = async (event: StripeEvent) => {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object;
        const updated = await markBookingAsPaidFromSession(session, event.id);
        return { processed: true, type: event.type, ...updated };
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const updated = await markBookingAsPaidByMetadata(
            paymentIntent.metadata,
            event.id,
            paymentIntent as unknown as Prisma.InputJsonValue,
        );

        return { processed: true, type: event.type, ...updated };
    }

    return { processed: false, type: event.type };
};

export const PaymentService = {
    initiatePayment,
    confirmPayment,
    handlerStripeWebhookEvent,
};