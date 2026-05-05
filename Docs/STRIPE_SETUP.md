# Stripe Setup & Configuration

## 1. Get Stripe API Keys & Webhook Secret

### Step 1: Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up or log in to your account
3. Navigate to the **Dashboard**

### Step 2: Find Your API Keys
1. Click **Developers** in the left sidebar
2. Click **API keys**
3. You'll see two keys (test and live):
   - **Publishable Key** (pk_test_... or pk_live_...)
   - **Secret Key** (sk_test_... or sk_live_...)

### Step 3: Create Webhook Endpoint
1. In **Developers**, click **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `http://localhost:3000/api/v1/payments/webhook` (for local) or your production domain
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `payment_intent.succeeded`
5. Click **Add endpoint**
6. Copy the **Signing secret** (whsec_...)

---

## 2. Configure Environment Variables

Create/update your `.env` file in the backend folder:

```env
# ... existing vars ...

STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

**Note:** For production, replace `sk_test_` and `pk_test_` with live keys (`sk_live_` and `pk_live_`).

---

## 3. Test Webhook Locally

### Option A: Using Stripe CLI (Recommended)

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # On Windows using scoop or download from https://github.com/stripe/stripe-cli/releases
   scoop install stripe
   
   # Or on macOS
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```
   - Paste your restricted API key when prompted

3. **Start webhook forwarding:**
   ```bash
   npm run stripe:webhook
   # or manually:
   stripe listen --forward-to http://localhost:3000/api/v1/payments/webhook
   ```

4. **In another terminal, trigger a test event:**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Option B: Using Webhook Testing Tool
- Visit [webhook.site](https://webhook.site) or similar to get a temporary URL
- Add that URL as a webhook endpoint in Stripe Dashboard
- Test events will be forwarded there

---

## 4. Admin Subscription Management Endpoints

All endpoints require `SUPER_ADMIN` role and authentication (cookie or Bearer token).

### Base URL: `http://localhost:3000/api/v1/subscriptions`

### Manage Subscription Plans

#### **GET all plans**
```bash
curl -b cookies.txt http://localhost:3000/api/v1/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "id": "plan-uuid",
      "code": "STARTER",
      "name": "Starter Plan",
      "billingCycle": "MONTHLY",
      "price": "499.00",
      "currencyCode": "BDT",
      "durationDays": 30,
      "maxStaff": 1,
      "maxProducts": 50,
      "maxInvoices": 100,
      "maxReports": false,
      "maxDiscounts": 0,
      "features": { "description": "...", "invoicing": true },
      "isActive": true,
      "createdAt": "2026-05-05T...",
      "updatedAt": "2026-05-05T..."
    }
  ]
}
```

---

#### **GET single plan**
```bash
curl -b cookies.txt http://localhost:3000/api/v1/subscriptions/plans/{planId}
```

---

#### **CREATE new plan**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/v1/subscriptions/plans \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PREMIUM",
    "name": "Premium Plan",
    "billingCycle": "MONTHLY",
    "price": 2499,
    "durationDays": 30,
    "maxStaff": 10,
    "maxProducts": 1000,
    "maxInvoices": 5000,
    "maxReports": true,
    "maxDiscounts": 50,
    "features": {
      "description": "For large stores",
      "invoicing": true,
      "inventory": true,
      "reports": true,
      "advancedSettings": true,
      "staffManagement": true,
      "customBranding": true
    }
  }'
```

---

#### **UPDATE plan**
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/v1/subscriptions/plans/{planId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Starter Plan Pro",
    "price": 599,
    "maxStaff": 2,
    "maxInvoices": 200,
    "maxReports": true,
    "features": {
      "description": "Updated for 2026",
      "invoicing": true,
      "inventory": true,
      "reports": true
    }
  }'
```

**Optional fields:**
- `name`
- `billingCycle` (MONTHLY | YEARLY)
- `price`
- `durationDays`
- `maxStaff`
- `maxProducts`
- `maxInvoices`
- `maxReports`
- `maxDiscounts`
- `features`
- `isActive` (true | false to disable/enable)

---

#### **DELETE plan**
```bash
curl -b cookies.txt -X DELETE http://localhost:3000/api/v1/subscriptions/plans/{planId}
```

**Note:** Cannot delete if plan has active subscriptions.

---

### Manage Shop Subscriptions

#### **GET all shop subscriptions**
```bash
curl -b cookies.txt http://localhost:3000/api/v1/subscriptions/records
```

Returns list of all active and inactive subscriptions across all shops.

---

#### **UPDATE subscription status**
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/v1/subscriptions/records/{subscriptionId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUSPENDED",
    "note": "Non-payment for 30 days",
    "paymentReference": "manual-suspension-001"
  }'
```

**Status options:**
- `TRIAL` - Trial period active
- `ACTIVE` - Subscription is active
- `PAST_DUE` - Payment overdue
- `EXPIRED` - Subscription period ended
- `CANCELED` - Subscription canceled by user
- `SUSPENDED` - Admin suspended (non-payment, etc.)

When status is `EXPIRED`, `SUSPENDED`, or `CANCELED`, the shop's dashboard is automatically locked.

---

## 5. Current Seeded Plans

Three plans are automatically seeded on first run:

| Code | Name | Price | Duration | Staff | Products | Invoices | Reports | Discounts |
|------|------|-------|----------|-------|----------|----------|---------|-----------|
| STARTER | Starter Plan | ৳499 | 30 days | 1 | 50 | 100 | No | 0 |
| PROFESSIONAL | Professional Plan | ৳999 | 30 days | 5 | 500 | 1,000 | Yes | 10 |
| ENTERPRISE | Enterprise Plan | ৳9,999 | 365 days | Unlimited | Unlimited | Unlimited | Yes | Unlimited |

**To reseed plans:**
```bash
npm run seed
```

---

## 6. Testing Payment Flow

### Shop Owner Payment Flow

1. **Shop owner initiates payment:**
```bash
# First, register/login as shop owner
curl -c shop_cookies.txt -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Khan",
    "email": "shop@example.com",
    "password": "Shop@123",
    "shopName": "Ahmed Store"
  }'
```

2. **Initiate Stripe checkout:**
```bash
curl -b shop_cookies.txt -X POST http://localhost:3000/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"planId": "<plan-id>"}'
```

Response includes `checkoutUrl` → Shop owner visits this URL to pay.

3. **After payment, webhook automatically:**
   - Creates `ShopSubscription` record with `transactionId` and `stripeSessionId`
   - Updates `Shop` status to `ACTIVE`
   - Sets subscription end date

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| `STRIPE_SECRET_KEY not set` | Add to `.env` file and restart server |
| Webhook not received | Check webhook URL in Stripe Dashboard (must be publicly accessible) |
| `Invalid Stripe signature` | Ensure `STRIPE_WEBHOOK_SECRET` is correct in `.env` |
| Plan creation fails | Check all required fields are provided (code, name, price, billingCycle, durationDays) |
| Cannot delete plan | Plan has active subscriptions; suspend/cancel them first |

---

## 8. Production Checklist

- [ ] Switch to **live API keys** (sk_live_..., pk_live_...)
- [ ] Update webhook endpoint URL to production domain
- [ ] Test full payment flow with real credit card
- [ ] Monitor webhook events in Stripe Dashboard
- [ ] Set up email notifications for failed payments
- [ ] Configure SCA (Strong Customer Authentication) if required

---

For more info, see [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks).
