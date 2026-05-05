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

## Quick Check
1. `npm run dev`
2. `npm run seed`
3. Login and call the route you want
