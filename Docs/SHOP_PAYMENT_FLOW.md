# Shop Creation Payment Flow

## Overview
This document describes the complete payment flow for creating a shop with Stripe integration.

---

## Payment Flow Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. POST /api/v1/shop/checkout
       │    (planId, shopName, image, description)
       ▼
┌─────────────────────────────────────┐
│  Backend Creates Stripe Session     │
│  - Validates user is SHOP_OWNER     │
│  - Checks plan exists & is active   │
│  - Creates checkout session         │
│  - Stores user ID in metadata       │
└─────────────────────┬───────────────┘
                      │
                      │ Returns: checkoutUrl, sessionId
                      ▼
                  ┌───────────────┐
                  │ Stripe Form   │
                  │ (Customer     │
                  │  Enters Card) │
                  └───────┬───────┘
                          │
                          │ Payment Processed
                          ▼
              ┌───────────────────────────┐
              │  Stripe Webhook Fires     │
              │  checkout.session.complete│
              │  d event                  │
              └───────────┬───────────────┘
                          │
                          │ POST /api/v1/payments/webhook
                          ▼
        ┌──────────────────────────────────────┐
        │ Backend Webhook Handler              │
        │ 1. Verify session payment_status=paid│
        │ 2. Check metadata.type=shop_creation │
        │ 3. Create shop & subscription        │
        │ 4. Update owner profile              │
        └──────────────────────────────────────┘
                          │
                          │
                          ▼
        ┌──────────────────────────────────┐
        │ User Now Has:                    │
        │ - Shop created                   │
        │ - Active subscription            │
        │ - Can access dashboard           │
        └──────────────────────────────────┘
```

---

## Step 1: Initiate Shop Checkout

**Endpoint:** `POST /api/v1/shop/checkout`

**Authentication:** Required (SHOP_OWNER role)

**Request Body:**
```json
{
  "planId": "plan-uuid-here",
  "shopName": "My Tech Store",
  "image": "https://example.com/logo.png",
  "description": "The best tech store in town"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stripe checkout session created successfully",
  "data": {
    "success": true,
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
    "sessionId": "cs_test_...",
    "publishableKey": "pk_test_..."
  }
}
```

**Error Response (400/403/404):**
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## Step 2: Customer Pays on Stripe

- User is redirected to Stripe checkout URL
- Customer enters card details
- Stripe processes the payment

---

## Step 3: Stripe Webhook Confirmation

**Automatic Process** - No action needed from user

When payment completes:
1. Stripe sends `checkout.session.completed` webhook
2. Backend webhook handler receives it at: `POST /api/v1/payments/webhook`
3. Signature is verified using Stripe webhook secret
4. Shop is created automatically:
   - Shop record created
   - Subscription record created with Stripe session details
   - Owner profile updated (onboardingCompleted = true)
   - Dashboard is unlocked

---

## Shop Creation Database State

After successful payment:

**Shop Record:**
```json
{
  "id": "shop-uuid",
  "ownerProfileId": "owner-profile-uuid",
  "shopName": "My Tech Store",
  "image": "https://example.com/logo.png",
  "slug": "my-tech-store",
  "description": "The best tech store in town",
  "status": "ACTIVE",
  "subscriptionStatus": "ACTIVE",
  "subscriptionStartsAt": "2026-05-05T14:30:00.000Z",
  "subscriptionEndsAt": "2026-06-04T14:30:00.000Z",
  "isDashboardLocked": false,
  "currentPlanId": "plan-uuid"
}
```

**ShopSubscription Record:**
```json
{
  "id": "subscription-uuid",
  "shopId": "shop-uuid",
  "planId": "plan-uuid",
  "status": "ACTIVE",
  "startsAt": "2026-05-05T14:30:00.000Z",
  "endsAt": "2026-06-04T14:30:00.000Z",
  "transactionId": "pi_test_...",
  "stripeSessionId": "cs_test_...",
  "stripeEventId": "evt_test_...",
  "amountPaid": 999,
  "autoRenew": true,
  "note": "Shop created via payment: evt_test_..."
}
```

---

## Webhook Event Details

**Event Type:** `checkout.session.completed`

**Session Metadata:**
```json
{
  "userId": "user-uuid",
  "planId": "plan-uuid",
  "shopName": "My Tech Store",
  "image": "https://example.com/logo.png",
  "description": "The best tech store in town",
  "type": "shop_creation"
}
```

The `type: "shop_creation"` field signals to the webhook handler that:
- This is a new shop creation (not subscription renewal)
- Shop doesn't exist yet (will be created)
- User ID is in metadata (instead of shopId)

---

## Error Handling

### Shop Already Exists
**Response:** 409 Conflict
```json
{
  "success": false,
  "message": "This owner already has a shop",
  "statusCode": 409
}
```

### Invalid Plan
**Response:** 404 Not Found
```json
{
  "success": false,
  "message": "Subscription plan not found or inactive",
  "statusCode": 404
}
```

### Unauthorized
**Response:** 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "statusCode": 401
}
```

### Not a Shop Owner
**Response:** 403 Forbidden
```json
{
  "success": false,
  "message": "Only shop owners can create a shop",
  "statusCode": 403
}
```

---

## Testing with cURL

### 1. Register as Shop Owner
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123",
    "name": "Shop Owner"
  }' \
  -c cookies.txt
```

### 2. Get Shop Plans (Public - No Auth)
```bash
curl http://localhost:5000/api/v1/subscriptions/plans/public
```

### 3. Initiate Checkout
```bash
curl -X POST http://localhost:5000/api/v1/shop/checkout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "planId": "plan-uuid-from-step-2",
    "shopName": "My Tech Store",
    "image": "https://example.com/logo.png",
    "description": "The best tech store in town"
  }'
```

Response will include `checkoutUrl` - open in browser to complete payment.

### 4. Verify Shop Created (After Payment + Webhook)
```bash
curl http://localhost:5000/api/v1/shop/me \
  -b cookies.txt
```

---

## Environment Variables Required

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Success/Cancel URLs
BETTER_AUTH_URL=http://localhost:3000
```

---

## Webhook Setup

1. **Start Stripe CLI:**
   ```bash
   npm run stripe:webhook
   ```

2. **Listen for Events:**
   Forwards webhook events to `http://localhost:5000/api/v1/payments/webhook`

3. **Test Events:**
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## Summary

| Step | Action | Handler | Time |
|------|--------|---------|------|
| 1 | User initiates checkout | POST /shop/checkout | Instant |
| 2 | Redirects to Stripe | Browser | User's control |
| 3 | Customer pays | Stripe | User's control |
| 4 | Webhook received | POST /payments/webhook | ~1-3 seconds after payment |
| 5 | Shop created | Database transaction | Automatic |
| 6 | Dashboard unlocked | User can login | Immediate |

---

## Success Criteria

✅ User receives Stripe checkout URL
✅ User completes payment on Stripe
✅ Webhook verifies payment
✅ Shop record created in database
✅ ShopSubscription record created with Stripe details
✅ Owner profile marked as onboarded
✅ Dashboard is unlocked (isDashboardLocked = false)
✅ User can access /api/v1/shop/me and see shop
