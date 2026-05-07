# Shop Payment API Quick Reference

## Public Endpoints (No Auth)

### List All Subscription Plans
```bash
GET /api/v1/subscriptions/plans/public

# Response
[
  {
    "id": "plan-uuid",
    "code": "STARTER",
    "name": "Starter Plan",
    "billingCycle": "MONTHLY",
    "price": 499,
    "currencyCode": "BDT",
    "durationDays": 30,
    "maxStaff": 1,
    "maxProducts": 50,
    "maxInvoices": 100,
    "maxReports": false,
    "maxDiscounts": 5,
    "features": [...]
  }
]
```

### Get Specific Plan
```bash
GET /api/v1/subscriptions/plans/public/{planId}
```

---

## Authenticated Endpoints (SHOP_OWNER Role)

### 1. Initiate Payment Checkout
```bash
POST /api/v1/shop/checkout

Content-Type: application/json

{
  "planId": "UUID-of-plan",
  "shopName": "My Store",
  "image": "https://example.com/logo.png",
  "description": "Optional description"
}

# Response - 200 OK
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

### 2. Get My Shop
```bash
GET /api/v1/shop/me

# Response - 200 OK
{
  "success": true,
  "message": "Shop retrieved successfully",
  "data": {
    "id": "shop-uuid",
    "ownerProfileId": "owner-uuid",
    "shopName": "My Store",
    "slug": "my-store",
    "subscriptionStatus": "ACTIVE",
    "isDashboardLocked": false,
    "currentPlanId": "plan-uuid",
    "subscriptionStartsAt": "2026-05-05T...",
    "subscriptionEndsAt": "2026-06-04T...",
    "currentPlan": { /* plan details */ },
    "subscriptions": [ /* subscription records */ ]
  }
}

# Response - 200 OK (No shop yet)
{
  "success": true,
  "message": "Shop retrieved successfully",
  "data": null
}
```

---

## Admin Endpoints (SUPER_ADMIN Role)

### List All Plans (with subscription counts)
```bash
GET /api/v1/subscriptions/plans

Authorization: Bearer {admin-token}

# Response - 200 OK
[
  {
    "id": "plan-uuid",
    "code": "STARTER",
    "name": "Starter Plan",
    "billingCycle": "MONTHLY",
    "price": 499,
    "subscriptions": [
      {
        "id": "sub-uuid",
        "status": "ACTIVE",
        "amountPaid": 499,
        "stripeSessionId": "cs_test_..."
      }
    ]
  }
]
```

### Create Subscription Plan
```bash
POST /api/v1/subscriptions/plans

Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "code": "NEWPLAN",
  "name": "New Plan",
  "billingCycle": "MONTHLY",
  "price": 1999,
  "currencyCode": "BDT",
  "durationDays": 30,
  "maxStaff": 5,
  "maxProducts": 100,
  "maxInvoices": 500,
  "maxReports": true,
  "maxDiscounts": 10,
  "features": {
    "invoicing": true,
    "inventory": true,
    "reports": true
  }
}
```

### Update Plan
```bash
PATCH /api/v1/subscriptions/plans/{planId}

# Same body as create
```

### Delete Plan
```bash
DELETE /api/v1/subscriptions/plans/{planId}

# Only if no active subscriptions
```

---

## Error Responses

### 401 - Not Authenticated
```json
{
  "success": false,
  "message": "Authentication required",
  "statusCode": 401
}
```

### 403 - Not Authorized
```json
{
  "success": false,
  "message": "Only shop owners can create a shop",
  "statusCode": 403
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Subscription plan not found or inactive",
  "statusCode": 404
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "This owner already has a shop",
  "statusCode": 409
}
```

---

## Flow Summary

1. **User registers** → Gets SHOP_OWNER role
2. **Browse plans** → GET /subscriptions/plans/public
3. **Initiate checkout** → POST /shop/checkout
   - Returns Stripe checkout URL
4. **User pays** → Redirected to Stripe
5. **Webhook confirms** → Shop created automatically
6. **User accesses shop** → GET /shop/me returns shop details

---

## Full Workflow Example

```bash
# 1. Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"Pass123","name":"Owner"}' \
  -c cookies.txt

# 2. Get plans
curl http://localhost:5000/api/v1/subscriptions/plans/public \
  | jq '.[0].id' # Save plan ID

# 3. Start checkout
curl -X POST http://localhost:5000/api/v1/shop/checkout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "planId":"PLAN_ID_FROM_STEP_2",
    "shopName":"My Store"
  }' | jq '.data.checkoutUrl' # Open in browser

# 4. Complete payment on Stripe

# 5. Verify shop created
curl http://localhost:5000/api/v1/shop/me \
  -b cookies.txt
```
