# Stripe Quick Setup

## Env
Add these to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Webhook
Use this endpoint:
- POST `/api/v1/payments/webhook`

Listen for these events:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `payment_intent.succeeded`

## Local Testing
```bash
npm run stripe:webhook
stripe trigger payment_intent.succeeded
```

## Payment Flow
1. Shop owner calls POST `/api/v1/payments/initiate`
2. Stripe returns checkout URL
3. Webhook creates or updates `ShopSubscription`
4. Expired subscription locks the shop dashboard automatically

## Subscription Routes
- GET `/api/v1/subscriptions/plans/public`
- GET `/api/v1/subscriptions/me`
- GET `/api/v1/subscriptions/records` - super admin only

## Lock Rule
- If trial/subscription time ends, shop becomes locked
- Access stays blocked until a new active subscription is created
