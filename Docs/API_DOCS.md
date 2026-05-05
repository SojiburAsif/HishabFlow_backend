# HishabFlow Backend — Quick API Docs

Base URL: `http://localhost:3000/api/v1`

This quick reference includes sample requests, responses and test accounts to exercise the main flows (auth, users, shops, payments, subscriptions).

---

## Test Accounts (seeded/default)
- Super Admin
  - email: `admin@hishabflow.local`
  - password: `Admin@12345`
  - role: `SUPER_ADMIN`

Use these credentials to log in and call admin-only endpoints like `GET /users`.

---

## Auth

- Register (creates a user; SHOP_OWNER if you pass shopName)

POST /auth/register
Content-Type: application/json

Sample body (shop owner):
```
{
  "name": "Rafi Owner",
  "email": "owner@example.com",
  "password": "Owner@123",
  "shopName": "Rafi Store",
  "image": "https://example.com/avatar.jpg",
  "shopImage": "https://example.com/shop.jpg"
}
```

Response: standard success object with created user and session cookies. The server sets session cookie and returns access token (also usable via `Authorization: Bearer <token>`).

- Login

POST /auth/login
```
{
  "email": "owner@example.com",
  "password": "Owner@123"
}
```

Use cookie jar with curl to preserve session:
```bash
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"Owner@123"}'
```

After login you can reuse the `cookies.txt` for subsequent calls:
```bash
curl -b cookies.txt http://localhost:3000/api/v1/users/me
```

---

## Users

- Get all users (admin only)

GET /users

Notes:
- Requires `SUPER_ADMIN` role. Use cookie or `Authorization: Bearer <accessToken>`.
- `superAdminProfile` objects in this response include two helper fields for admin view: `userName` and `userEmail` (these are derived from the `User` record).

- Update my profile

PATCH /users/me/profile
Content-Type: application/json

Sample body:
```
{
  "name": "Alice Admin",
  "displayName": "Alice",
  "phone": "+8801XXXXXXXXX",
  "shopName": "Alice Mart",
  "shopImage": "https://example.com/shop.jpg"
}
```

Notes:
- For `SUPER_ADMIN`, IP address will be captured automatically and stored on `superAdminProfile.ipAddress` when this endpoint is called.

---

## Shops

- Buy / create shop (SHOP_OWNER)

POST /shops/buy
Content-Type: application/json

Sample body (placeholder flow — payment handled separately):
```
{
  "planId": "<subscription-plan-id>",
  "paymentReference": "<gateway-ref>"
}
```

This endpoint expects payment confirmation to be done via the payments endpoints (placeholders exist at `/payments/initiate` and `/payments/confirm`).

---

## Payments (placeholders)

- Initiate payment

POST /payments/initiate
```
{
  "amount": 1000,
  "currency": "BDT",
  "shopId": "<shop-id>"
}
```

- Confirm payment

POST /payments/confirm
```
{
  "paymentReference": "<gateway-ref>",
  "status": "success"
}
```

---

## Subscriptions (admin)

- Get plans
GET /subscriptions/plans

- Create plan (admin)
POST /subscriptions/plans
```
{
  "name": "Pro",
  "price": 1999,
  "billingCycle": "MONTHLY",
  "features": "..."
}
```

---

## Quick testing checklist

1. Start server: `npm run dev` (or `npm run build && node dist/server.js`).
2. Seed super admin (already provided): `npm run seed` (or `tsx prisma/seed.ts`).
3. Login as super admin:
```bash
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hishabflow.local","password":"Admin@12345"}'
```
4. Call admin-only endpoint using cookies:
```bash
curl -b cookies.txt http://localhost:3000/api/v1/users
```
5. Register a shop owner (new user) via `/auth/register`, then log in and call `/shops/buy`.

---

If you want, I can convert this into a Postman collection or a more formal OpenAPI spec next — which do you prefer?
