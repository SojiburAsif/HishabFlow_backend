# HishabFlow Backend Quick API Docs

Base URL: `http://localhost:3000/api/v1`

## Test Login
- Super Admin
  - email: `admin@hishabflow.local`
  - password: `Admin@12345`

## Auth
- POST `/auth/register`
- POST `/auth/login`
 
## Users
- GET `/users` - super admin only
- GET `/users/me/profile`
- GET `/users/profile`
- PATCH `/users/me/profile`
- PATCH `/users/profile`

Sample update body:
```json
{
  "name": "Alice Admin",
  "displayName": "Alice",
  "phone": "+8801XXXXXXXXX",
  "shopName": "Alice Mart",
  "shopImage": "https://example.com/shop.jpg"
}
```

## Shops
- POST `/shops/checkout` - start shop payment
- POST `/shops/buy` - legacy create flow
- GET `/shops/me`
- PATCH `/shops/me`

Sample shop update body:
```json
{
  "shopName": "New Shop Name",
  "image": "https://example.com/shop.jpg",
  "description": "Updated shop",
  "currencyCode": "BDT",
  "timezone": "Asia/Dhaka",
  "lowStockThreshold": 10
}
```

## Payments
- POST `/payments/initiate`
- POST `/payments/confirm`
- GET `/payments/my`
- GET `/payments/all` - super admin only
- GET `/payments/success`
- GET `/payments/cancel`
- POST `/payments/webhook`

## Subscriptions
- GET `/subscriptions/plans/public`
- GET `/subscriptions/plans/public/:id`
- GET `/subscriptions/plans` - super admin only
- POST `/subscriptions/plans` - super admin only
- GET `/subscriptions/plans/:id` - super admin only
- PATCH `/subscriptions/plans/:id` - super admin only
- DELETE `/subscriptions/plans/:id` - super admin only
- GET `/subscriptions/me`
- GET `/subscriptions/records` - super admin only
- PATCH `/subscriptions/records/:id` - super admin only

## Notes
- Shop owner and staff access is blocked automatically when subscription or trial is expired.
- When a subscription expires, the shop is marked locked in the database and access stays blocked until renewed.

## Staff
- POST `/staff` - add a staff member to your shop (shop owner only)
  - Body: `{ "email": "staff@example.com", "displayName"?: "Name", "phone"?: "+8801...", "designation"?: "Cashier" }`
  - Behavior: the service checks the shop's `currentPlan.maxStaff`. If the plan defines a non-negative `maxStaff` and the active staff count is already at or above that number, the request is rejected with `409 CONFLICT` and message `Staff limit reached for current plan`.
  - The target user must already be registered. If not found, the endpoint returns `404` and asks them to register first.
  - On success: the user's `role` is set to `STAFF` and a `StaffProfile` is created for the shop.

- GET `/staff` - list staff for your shop (shop owner only)

- PATCH `/staff/:id/deactivate` - deactivate a staff profile (shop owner only)
  - Sets `StaffProfile.isActive = false`. Deactivated staff cannot access protected routes.

Security & behavior notes:
- Only users with role `SHOP_OWNER` can create, list or deactivate staff.
- `maxStaff` semantics: if `maxStaff` is `null` or `-1` it is treated as unlimited; otherwise it's an enforced cap.
- Access enforcement: existing `checkAuth` middleware blocks inactive staff and blocked shops (expired subscriptions) from accessing protected endpoints.

Quick test flow:
1. Ensure shop owner has a shop with a defined `currentPlan` (or use the seeded plans).
2. Call `POST /staff` with an already-registered user's email.
3. If under limit, user will become `STAFF` and `StaffProfile` will be created.


## Quick Check
1. `npm run dev`
2. `npm run seed`
3. Login and call the route you want
