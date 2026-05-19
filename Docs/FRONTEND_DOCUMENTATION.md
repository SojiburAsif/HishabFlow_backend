# ফ্রন্টএন্ড সিস্টেম - বিস্তারিত বর্ণনা
*Frontend System - Detailed Documentation*

**তৈরির তারিখ**: May 19, 2026  
**প্রযুক্তি স্ট্যাক**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + HeroUI v3

---

## 📋 সূচিপত্র

1. [ফ্রন্টএন্ড সম্পর্কে](#overview)
2. [প্রযুক্তি স্ট্যাক](#tech-stack)
3. [ফোল্ডার স্ট্রাকচার](#folder-structure)
4. [পেজ এবং রুট](#pages-routes)
5. [কম্পোনেন্ট আর্কিটেকচার](#components)
6. [এপিআই সার্ভিস](#services)
7. [হুক এবং ইউটিলিটি](#hooks-utils)
8. [ডেটা ফ্লো](#data-flow)
9. [অথেন্টিকেশন সিস্টেম](#authentication)

---

## ফ্রন্টএন্ড সম্পর্কে

ফ্রন্টএন্ড হল একটি **আধুনিক, দ্রুত এবং ইন্টারঅ্যাক্টিভ ওয়েব অ্যাপ্লিকেশন** যা:

✅ **Next.js 16** দিয়ে তৈরি (React 19 সাপোর্ট)  
✅ **TypeScript** দিয়ে সম্পূর্ণ টাইপ-সেফ  
✅ **HeroUI v3** দিয়ে সুন্দর ইউআই কম্পোনেন্ট  
✅ **Tailwind CSS v4** দিয়ে দ্রুত স্টাইলিং  
✅ **Zod** দিয়ে ফর্ম ভ্যালিডেশন  
✅ **রেসপন্সিভ ডিজাইন** (মোবাইল-ফার্স্ট)  
✅ **রিয়েল-টাইম আপডেট** সক্ষমতা  

---

## প্রযুক্তি স্ট্যাক

### 🎯 মূল প্রযুক্তি

| প্রযুক্তি | সংস্করণ | উদ্দেশ্য |
|----------|---------|---------|
| **Next.js** | 16.2.4 | React ফ্রেমওয়ার্ক এবং রাউটিং |
| **React** | 19.2.4 | ইউআই লাইব্রেরি |
| **TypeScript** | 5 | টাইপ সেফটি |
| **Tailwind CSS** | 4 | ইউটিলিটি-ফার্স্ট CSS |
| **HeroUI** | 3.0.3 | প্রি-বিল্ট কম্পোনেন্ট লাইব্রেরি |
| **Zod** | 4.4.3 | স্কিমা ভ্যালিডেশন |

### 📦 গুরুত্বপূর্ণ নির্ভরতা

```json
{
  "কম্পোনেন্ট এবং ইউআই": {
    "@heroui/react": "রেডি-মেড কম্পোনেন্ট",
    "@heroui/styles": "HeroUI স্টাইল শিট",
    "lucide-react": "আইকন লাইব্রেরি",
    "framer-motion": "অ্যানিমেশন লাইব্রেরি"
  },
  
  "ডেটা ম্যানেজমেন্ট": {
    "@tanstack/react-table": "টেবিল ম্যানেজমেন্ট",
    "zod": "ফর্ম ভ্যালিডেশন",
    "react-fast-marquee": "স্ক্রলিং টেক্সট"
  },
  
  "অথেন্টিকেশন": {
    "jsonwebtoken": "JWT হ্যান্ডলিং",
    "next-themes": "ডার্ক/লাইট থিম"
  },
  
  "চার্ট এবং ভিজুয়ালাইজেশন": {
    "recharts": "ইন্টারঅ্যাক্টিভ চার্ট"
  },
  
  "নোটিফিকেশন": {
    "sonner": "টোস্ট নোটিফিকেশন"
  },
  
  "ইউটিলিটি": {
    "clsx": "CSS ক্লাস মার্জিং",
    "tailwind-merge": "Tailwind ক্লাস মার্জিং"
  }
}
```

---

## ফোল্ডার স্ট্রাকচার

```
fontend/
├── src/
│   ├── app/                              # Next.js অ্যাপ ডিরেক্টরি
│   │   ├── layout.tsx                   # রুট লেআউট
│   │   ├── error.tsx                    # এরর পেজ
│   │   ├── not-found.tsx                # 404 পেজ
│   │   ├── globals.css                  # গ্লোবাল স্টাইল
│   │   │
│   │   ├── (commonLayout)/              # সাধারণ লেআউট গ্রুপ
│   │   │   ├── layout.tsx               # Common লেআউট
│   │   │   ├── page.tsx                 # হোমপেজ
│   │   │   ├── auth/                    # অথেন্টিকেশন পেজ
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── shop/page.tsx            # শপ ব্রাউজিং পেজ
│   │   │   └── about/page.tsx           # আবাউট পেজ
│   │   │
│   │   ├── (dashboardLayout)/           # ড্যাশবোর্ড লেআউট গ্রুপ
│   │   │   ├── layout.tsx               # ড্যাশবোর্ড লেআউট
│   │   │   ├── dashboard/               # মেইন ড্যাশবোর্ড
│   │   │   │   ├── page.tsx             # ড্যাশবোর্ড হোম
│   │   │   │   ├── products/            # পণ্য ম্যানেজমেন্ট
│   │   │   │   ├── orders/              # অর্ডার ম্যানেজমেন্ট
│   │   │   │   ├── payments/            # পেমেন্ট হিস্টরি
│   │   │   │   ├── subscription/        # সাবস্ক্রিপশন ম্যানেজমেন্ট
│   │   │   │   ├── staff/               # স্টাফ ম্যানেজমেন্ট
│   │   │   │   └── settings/            # সেটিংস
│   │   │   └── profile/page.tsx         # প্রোফাইল পেজ
│   │   │
│   │   └── constants/                   # অ্যাপ্লিকেশন ধ্রুবক
│   │
│   ├── components/                      # রিইউজেবল কম্পোনেন্ট
│   │   ├── Auth/                        # অথেন্টিকেশন কম্পোনেন্ট
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── PasswordReset.tsx
│   │   │   └── OtpVerification.tsx
│   │   │
│   │   ├── module/                      # ফিচার-স্পেসিফিক কম্পোনেন্ট
│   │   │   ├── product/                 # পণ্য সংক্রান্ত
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   ├── ProductTable.tsx
│   │   │   │   └── CategoryManager.tsx
│   │   │   │
│   │   │   ├── order/                   # অর্ডার সংক্রান্ত
│   │   │   │   ├── OrderCard.tsx
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   ├── OrderTable.tsx
│   │   │   │   └── OrderTracking.tsx
│   │   │   │
│   │   │   ├── payment/                 # পেমেন্ট সংক্রান্ত
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   ├── PaymentHistory.tsx
│   │   │   │   ├── StripeCheckout.tsx
│   │   │   │   └── InvoiceViewer.tsx
│   │   │   │
│   │   │   ├── subscription/            # সাবস্ক্রিপশন সংক্রান্ত
│   │   │   │   ├── PlanCard.tsx
│   │   │   │   ├── SubscriptionSection.tsx
│   │   │   │   ├── PlanComparison.tsx
│   │   │   │   └── UpgradeModal.tsx
│   │   │   │
│   │   │   ├── shop/                    # শপ সংক্রান্ত
│   │   │   │   ├── ShopCard.tsx
│   │   │   │   ├── ShopForm.tsx
│   │   │   │   ├── ShopSettings.tsx
│   │   │   │   └── ShopAnalytics.tsx
│   │   │   │
│   │   │   ├── staff/                   # স্টাফ সংক্রান্ত
│   │   │   │   ├── StaffCard.tsx
│   │   │   │   ├── StaffForm.tsx
│   │   │   │   ├── StaffTable.tsx
│   │   │   │   └── PermissionManager.tsx
│   │   │   │
│   │   │   ├── dashboard/               # ড্যাশবোর্ড উইজেট
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── ChartCard.tsx
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   └── UserActivityChart.tsx
│   │   │   │
│   │   │   └── user/                    # ইউজার প্রোফাইল
│   │   │       ├── ProfileCard.tsx
│   │   │       ├── ProfileForm.tsx
│   │   │       └── PreferenceManager.tsx
│   │   │
│   │   ├── shared/                      # শেয়ার্ড কম্পোনেন্ট
│   │   │   ├── Header.tsx               # শীর্ষ নেভিগেশন
│   │   │   ├── Sidebar.tsx              # সাইড নেভিগেশন
│   │   │   ├── Footer.tsx               # ফুটার
│   │   │   ├── Breadcrumb.tsx           # ব্রেডক্রাম
│   │   │   ├── Loader.tsx               # লোডিং স্পিনার
│   │   │   ├── Modal.tsx                # মডাল ডায়ালগ
│   │   │   ├── Notification.tsx         # বিজ্ঞপ্তি
│   │   │   └── ConfirmDialog.tsx        # নিশ্চিতকরণ ডায়ালগ
│   │   │
│   │   ├── static/                      # স্ট্যাটিক কম্পোনেন্ট
│   │   │   ├── NavBar.tsx               # নেভিগেশন বার
│   │   │   ├── HeroSection.tsx          # হিরো সেকশন
│   │   │   ├── FeatureSection.tsx       # ফিচার সেকশন
│   │   │   └── TestimonialSection.tsx   # প্রশংসাপত্র সেকশন
│   │   │
│   │   └── ui/                          # বেসিক ইউআই কম্পোনেন্ট
│   │       ├── Button.tsx               # বোতাম
│   │       ├── Input.tsx                # ইনপুট ফিল্ড
│   │       ├── Card.tsx                 # কার্ড
│   │       ├── Badge.tsx                # ব্যাজ
│   │       ├── Avatar.tsx               # এভাটার
│   │       ├── Dropdown.tsx             # ড্রপডাউন
│   │       ├── Tab.tsx                  # ট্যাব
│   │       └── Toast.tsx                # টোস্ট
│   │
│   ├── hooks/                           # কাস্টম React হুক
│   │   ├── use-mobile.ts                # মোবাইল ডিটেকশন
│   │   ├── useAuth.ts                   # অথেন্টিকেশন হুক
│   │   ├── useShop.ts                   # শপ ডেটা হুক
│   │   ├── usePayment.ts                # পেমেন্ট হুক
│   │   ├── useSubscription.ts           # সাবস্ক্রিপশন হুক
│   │   └── useFetch.ts                  # এপিআই ফেচিং হুক
│   │
│   ├── lib/                             # ইউটিলিটি এবং সহায়ক
│   │   ├── authUtils.ts                 # অথেন্টিকেশন সহায়ক
│   │   ├── cookieUtils.ts               # কুকি ম্যানেজমেন্ট
│   │   ├── env.ts                       # পরিবেশ ভেরিয়েবল
│   │   ├── imageUpload.utils.ts         # ছবি আপলোড
│   │   ├── jwtUtils.ts                  # JWT পার্সিং
│   │   ├── tokenUtils.ts                # টোকেন ম্যানেজমেন্ট
│   │   ├── utils.ts                     # সাধারণ ইউটিলিটি
│   │   ├── api.ts                       # API ক্লায়েন্ট
│   │   └── providers/                   # React Context প্রোভাইডার
│   │       ├── AuthProvider.tsx         # অথেন্টিকেশন প্রোভাইডার
│   │       ├── ThemeProvider.tsx        # থিম প্রোভাইডার
│   │       └── NotificationProvider.tsx # নোটিফিকেশন প্রোভাইডার
│   │
│   ├── services/                        # এপিআই সার্ভিস
│   │   ├── auth.service.ts              # অথেন্টিকেশন সার্ভিস
│   │   ├── user.service.ts              # ইউজার সার্ভিস
│   │   ├── shop.service.ts              # শপ সার্ভিস
│   │   ├── product.service.ts           # পণ্য সার্ভিস
│   │   ├── order.service.ts             # অর্ডার সার্ভিস
│   │   ├── payment.service.ts           # পেমেন্ট সার্ভিস
│   │   ├── subscription.service.ts      # সাবস্ক্রিপশন সার্ভিস
│   │   ├── dashboard.service.ts         # ড্যাশবোর্ড সার্ভিস
│   │   ├── invoice.service.ts           # ইনভয়েস সার্ভিস
│   │   └── notification.service.ts      # নোটিফিকেশন সার্ভিস
│   │
│   ├── types/                           # TypeScript টাইপ সংজ্ঞা
│   │   ├── index.d.ts                   # প্রধান টাইপ সংজ্ঞা
│   │   ├── auth.types.ts                # অথেন্টিকেশন টাইপ
│   │   ├── shop.types.ts                # শপ টাইপ
│   │   ├── product.types.ts             # পণ্য টাইপ
│   │   └── Router.type.ts               # রুট টাইপ
│   │
│   ├── zod/                             # Zod ভ্যালিডেশন স্কিমা
│   │   ├── auth.schema.ts               # অথেন্টিকেশন স্কিমা
│   │   ├── shop.schema.ts               # শপ স্কিমা
│   │   ├── product.schema.ts            # পণ্য স্কিমা
│   │   ├── order.schema.ts              # অর্ডার স্কিমা
│   │   └── payment.schema.ts            # পেমেন্ট স্কিমা
│   │
│   └── proxy.ts                         # API প্রক্সি সেটিংস
│
├── public/                              # স্ট্যাটিক অ্যাসেট
│   ├── images/
│   ├── icons/
│   └── logos/
│
├── next.config.ts                       # Next.js কনফিগারেশন
├── tsconfig.json                        # TypeScript কনফিগারেশন
├── tailwind.config.js                   # Tailwind কনফিগারেশন
├── postcss.config.js                    # PostCSS কনফিগারেশন
├── package.json                         # নির্ভরতা এবং স্ক্রিপ্ট
└── README.md                            # প্রজেক্ট ডকুমেন্টেশন
```

---

## পেজ এবং রুট

### 🔐 অথেন্টিকেশন পেজ (`(commonLayout)/auth/`)

#### 1. **লগইন পেজ** (`/auth/login`)
- **উদ্দেশ্য**: ব্যবহারকারীর লগইন
- **ফিচার**:
  - ইমেইল এবং পাসওয়ার্ড ইনপুট
  - "আমাকে মনে রাখুন" অপশন
  - পাসওয়ার্ড রিসেট লিঙ্ক
  - রেজিস্ট্রেশনের জন্য লিঙ্ক
  - ফর্ম ভ্যালিডেশন (Zod)
  - এরর মেসেজ ডিসপ্লে
- **কম্পোনেন্ট**: `LoginForm.tsx`
- **সার্ভিস**: `auth.service.ts` → `login()`

#### 2. **রেজিস্ট্রেশন পেজ** (`/auth/register`)
- **উদ্দেশ্য**: নতুন অ্যাকাউন্ট তৈরি
- **ফিচার**:
  - নাম, ইমেইল, পাসওয়ার্ড ইনপুট
  - পাসওয়ার্ড স্ট্রেংথ ইন্ডিকেটর
  - টার্মস অফ সার্ভিস চেকবক্স
  - লগইনের জন্য লিঙ্ক
  - ফর্ম ভ্যালিডেশন
- **কম্পোনেন্ট**: `RegisterForm.tsx`
- **সার্ভিস**: `auth.service.ts` → `register()`

#### 3. **পাসওয়ার্ড রিসেট পেজ** (`/auth/reset-password`)
- **উদ্দেশ্য**: ভুলে যাওয়া পাসওয়ার্ড পুনরুদ্ধার
- **ফিচার**:
  - ইমেইল ইনপুট
  - OTP যাচাইকরণ
  - নতুন পাসওয়ার্ড সেট করা
- **কম্পোনেন্ট**: `PasswordReset.tsx`

### 🏠 সাধারণ পেজ

#### 1. **হোমপেজ** (`/`)
- **উদ্দেশ্য**: অ্যাপ্লিকেশনের ইন্ট্রোডাকশন
- **ফিচার**:
  - হিরো সেকশন
  - ফিচার প্রদর্শন
  - মূল্য নির্ধারণ প্ল্যান
  - প্রশংসাপত্র
  - কল-টু-অ্যাকশন বোতাম

#### 2. **শপ ব্রাউজিং** (`/shop`)
- **উদ্দেশ্য**: সব শপ এবং পণ্য দেখা
- **ফিচার**:
  - শপ লিস্ট
  - পণ্য গ্রিড
  - সার্চ এবং ফিল্টার
  - পণ্য বিস্তারিত মডাল

#### 3. **আবাউট পেজ** (`/about`)
- **উদ্দেশ্য**: সম্পর্কে তথ্য
- **ফিচার**:
  - কোম্পানির তথ্য
  - মিশন এবং ভিশন
  - টিমের সদস্য

### 📊 ড্যাশবোর্ড পেজ (`(dashboardLayout)/dashboard/`)

#### 1. **ড্যাশবোর্ড হোম** (`/dashboard`)
- **অধিকার**: সব লগইন-ইউজার
- **ফিচার**:
  - স্ট্যাটিস্টিক্স কার্ড:
    - মোট বিক্রয়
    - মোট অর্ডার
    - মোট গ্রাহক
    - মাসিক রাজস্ব
  - চার্ট এবং গ্রাফ:
    - বিক্রয় ট্রেন্ড
    - পণ্য বিক্রয়
    - অর্ডার স্ট্যাটাস বিতরণ
  - সাম্প্রতিক অর্ডার টেবিল
  - দ্রুত অ্যাকশন বাটন
- **কম্পোনেন্ট**: `StatCard.tsx`, `ChartCard.tsx`

#### 2. **পণ্য ম্যানেজমেন্ট** (`/dashboard/products`)
- **অধিকার**: Shop Owner, Staff
- **সাব-পেজ**:

  **a) পণ্য তালিকা**
  - টেবিল ভিউ সব পণ্যের
  - কলাম: নাম, SKU, মূল্য, স্টক, অ্যাকশন
  - সার্চ এবং ফিল্টার:
    - ক্যাটেগরি দ্বারা ফিল্টার
    - মূল্য পরিসর ফিল্টার
    - স্টক স্ট্যাটাস ফিল্টার
  - পেজিনেশন
  - বাল্ক অ্যাকশন (মুছা, আপডেট)
  - নতুন পণ্য যোগ করার বাটন
  - কম্পোনেন্ট: `ProductTable.tsx`

  **b) পণ্য তৈরি/সম্পাদনা**
  - ফর্ম ফিল্ড:
    - পণ্যের নাম (প্রয়োজনীয়)
    - SKU (প্রয়োজনীয়)
    - বর্ণনা
    - মূল্য
    - ছবি আপলোড
    - ক্যাটেগরি নির্বাচন
    - স্টক পরিমাণ
    - ট্যাগ এবং বৈশিষ্ট্য
  - ভ্যালিডেশন (Zod স্কিমা)
  - সাফল্য/এরর বার্তা
  - কম্পোনেন্ট: `ProductForm.tsx`

  **c) ক্যাটেগরি ম্যানেজমেন্ট**
  - ক্যাটেগরি তালিকা
  - নতুন ক্যাটেগরি তৈরি
  - ক্যাটেগরি সম্পাদনা/মুছা
  - কম্পোনেন্ট: `CategoryManager.tsx`

#### 3. **অর্ডার ম্যানেজমেন্ট** (`/dashboard/orders`)
- **অধিকার**: Shop Owner, Staff
- **ফিচার**:
  - অর্ডার টেবিল:
    - অর্ডার ID
    - গ্রাহক নাম
    - মোট পরিমাণ
    - অর্ডার স্ট্যাটাস
    - অর্ডারের তারিখ
  - ফিল্টার:
    - স্ট্যাটাস দ্বারা (পেন্ডিং, কনফার্মড, শিপড, ডেলিভার্ড)
    - তারিখ পরিসর
    - গ্রাহক দ্বারা
  - অর্ডার বিস্তারিত দেখা
  - অর্ডার স্ট্যাটাস আপডেট করা
  - ইনভয়েস ডাউনলোড
  - কম্পোনেন্ট: `OrderTable.tsx`, `OrderTracking.tsx`

#### 4. **পেমেন্ট হিস্টরি** (`/dashboard/payments`)
- **অধিকার**: সব ব্যবহারকারী
- **ফিচার**:
  - লেনদেন টেবিল:
    - লেনদেন আইডি
    - তারিখ
    - পরিমাণ
    - স্ট্যাটাস
    - ধরন (সাবস্ক্রিপশন, অর্ডার)
  - ফিল্টার:
    - স্ট্যাটাস দ্বারা
    - তারিখ পরিসর
  - ইনভয়েস ডাউনলোড
  - রিসিট ডাউনলোড
  - পুনরায় পেমেন্ট অপশন
  - কম্পোনেন্ট: `PaymentHistory.tsx`

#### 5. **সাবস্ক্রিপশন ম্যানেজমেন্ট** (`/dashboard/subscription`)
- **অধিকার**: Shop Owner
- **ফিচার**:
  - বর্তমান সাবস্ক্রিপশন তথ্য:
    - প্ল্যান নাম
    - স্ট্যাটাস (সক্রিয়, ট্রায়াল, মেয়াদ উত্তীর্ণ)
    - পুনর্নবীকরণ তারিখ
    - ট্রায়াল শেষ তারিখ
    - বৈশিষ্ট্য তালিকা
  - প্ল্যান নির্বাচন:
    - সমস্ত উপলব্ধ প্ল্যান প্রদর্শন
    - প্ল্যান তুলনা
    - আপগ্রেড/ডাউনগ্রেড বাটন
  - পেমেন্ট গেটওয়ে রিডিরেক্ট (Stripe)
  - বিলিং ইতিহাস
  - কম্পোনেন্ট: `SubscriptionSection.tsx`, `PlanCard.tsx`

#### 6. **স্টাফ ম্যানেজমেন্ট** (`/dashboard/staff`)
- **অধিকার**: Shop Owner
- **ফিচার**:
  - স্টাফ টেবিল:
    - নাম
    - ইমেইল
    - ভূমিকা
    - যোগদান তারিখ
    - অ্যাকশন
  - নতুন স্টাফ যোগ করা:
    - স্টাফ ইমেইল নির্বাচন
    - ভূমিকা নির্ধারণ
    - পারমিশন সেট করা
  - স্টাফ সম্পাদনা:
    - নাম, ইমেইল পরিবর্তন
    - ভূমিকা এবং পারমিশন আপডেট
  - স্টাফ অপসারণ
  - পারমিশন ম্যানেজার
  - কম্পোনেন্ট: `StaffTable.tsx`, `StaffForm.tsx`, `PermissionManager.tsx`

#### 7. **সেটিংস** (`/dashboard/settings`)
- **অধিকার**: সব ব্যবহারকারী
- **ফিচার**:
  - শপ সেটিংস:
    - শপের নাম
    - শপের বর্ণনা
    - শপের লোগো
    - যোগাযোগ তথ্য
  - ব্যক্তিগত সেটিংস:
    - থিম নির্বাচন (ডার্ক/লাইট)
    - ভাষা পছন্দ
    - সময় অঞ্চল
  - নোটিফিকেশন সেটিংস:
    - ইমেইল নোটিফিকেশন
    - পুশ নোটিফিকেশন
    - এসএমএস নোটিফিকেশন
  - নিরাপত্তা সেটিংস:
    - পাসওয়ার্ড পরিবর্তন
    - টু-ফ্যাক্টর অথেন্টিকেশন
    - সেশন ম্যানেজমেন্ট
  - API কী পরিচালনা

### 👤 প্রোফাইল পেজ (`/profile`)
- **অধিকার**: সব লগইন-ইউজার
- **ফিচার**:
  - প্রোফাইল তথ্য সম্পাদনা
  - প্রোফাইল ছবি পরিবর্তন
  - ব্যক্তিগত পছন্দ আপডেট
  - অ্যাকাউন্ট ডেলিট অপশন

---

## কম্পোনেন্ট আর্কিটেকচার

### 🏗️ কম্পোনেন্ট শ্রেণীবিভাগ

#### 1. **পেজ কম্পোনেন্ট**
```tsx
// উদাহরণ: LoginPage
export default function LoginPage() {
  return (
    <div>
      <LoginForm />
    </div>
  );
}
```

#### 2. **লেআউট কম্পোনেন্ট**
```tsx
// উদাহরণ: DashboardLayout
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Header />
        {children}
        <Footer />
      </main>
    </div>
  );
}
```

#### 3. **ফিচার কম্পোনেন্ট**
```tsx
// ProductForm - পণ্য ফর্ম কম্পোনেন্ট
interface ProductFormProps {
  onSubmit: (data: ProductData) => void;
  initialData?: ProductData;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData);
  // ... ফর্ম হ্যান্ডলিং
};
```

#### 4. **শেয়ারড কম্পোনেন্ট**
```tsx
// Header - শেয়ারড হেডার
export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      {/* হেডার কন্টেন্ট */}
    </header>
  );
};
```

#### 5. **ইউআই কম্পোনেন্ট (HeroUI)**
```tsx
// Button কম্পোনেন্ট (HeroUI থেকে)
import { Button } from "@heroui/react";

<Button 
  color="primary" 
  size="lg"
  onPress={handleClick}
>
  ক্লিক করুন
</Button>
```

### 📋 প্রধান কম্পোনেন্ট তালিকা

| কম্পোনেন্ট | অবস্থান | উদ্দেশ্য |
|----------|---------|---------|
| `LoginForm` | `components/Auth/` | লগইন ফর্ম |
| `RegisterForm` | `components/Auth/` | রেজিস্ট্রেশন ফর্ম |
| `ProductTable` | `components/module/product/` | পণ্য তালিকা |
| `ProductForm` | `components/module/product/` | পণ্য সম্পাদনা ফর্ম |
| `OrderTable` | `components/module/order/` | অর্ডার তালিকা |
| `PaymentHistory` | `components/module/payment/` | পেমেন্ট হিস্টরি |
| `SubscriptionSection` | `components/module/subscription/` | সাবস্ক্রিপশন ম্যানেজার |
| `Sidebar` | `components/shared/` | সাইড নেভিগেশন |
| `Header` | `components/shared/` | শীর্ষ নেভিগেশন |
| `Modal` | `components/shared/` | মডাল ডায়ালগ |
| `StatCard` | `components/module/dashboard/` | স্ট্যাটিস্টিক্স কার্ড |
| `ChartCard` | `components/module/dashboard/` | চার্ট প্রদর্শনী |

---

## এপিআই সার্ভিস

সব সার্ভিস `src/services/` ডিরেক্টরিতে অবস্থিত এবং **HTTP অনুরোধ** পাঠায়।

### 1️⃣ **Auth সার্ভিস** (`auth.service.ts`)

```typescript
// লগইন
login(email: string, password: string): Promise<AuthResponse>

// রেজিস্ট্রেশন
register(userData: RegisterData): Promise<AuthResponse>

// লগআউট
logout(): Promise<void>

// টোকেন রিফ্রেশ
refreshToken(): Promise<TokenResponse>

// বর্তমান ইউজার তথ্য
getMe(): Promise<UserData>
```

### 2️⃣ **User সার্ভিস** (`user.service.ts`)

```typescript
// আমার প্রোফাইল
getProfile(): Promise<UserProfile>

// প্রোফাইল আপডেট
updateProfile(data: UserProfile): Promise<UserProfile>

// সব ইউজার (Admin)
getAllUsers(filters?: UserFilter): Promise<User[]>

// ইউজার বিবরণ
getUser(id: string): Promise<User>
```

### 3️⃣ **Shop সার্ভিস** (`shop.service.ts`)

```typescript
// আমার শপ তথ্য
getMyShop(): Promise<ShopData>

// শপ আপডেট
updateMyShop(data: ShopData): Promise<ShopData>

// শপ স্টাফ পান
getShopStaff(): Promise<Staff[]>

// স্টাফ অ্যাকাউন্ট তৈরি করুন
createStaffAccount(email: string, role: string): Promise<Staff>

// সব শপ পান (Admin)
getAllShops(): Promise<Shop[]>
```

### 4️⃣ **Product সার্ভিস** (`product.service.ts`)

```typescript
// পণ্য তালিকা
getProducts(shopId?: string): Promise<Product[]>

// পণ্য বিস্তারিত
getProduct(id: string): Promise<Product>

// পণ্য তৈরি
createProduct(data: ProductData): Promise<Product>

// পণ্য আপডেট
updateProduct(id: string, data: ProductData): Promise<Product>

// পণ্য মুছা
deleteProduct(id: string): Promise<void>

// পণ্য সার্চ
searchProducts(query: string): Promise<Product[]>
```

### 5️⃣ **Order সার্ভিস** (`order.service.ts`)

```typescript
// অর্ডার তালিকা
getOrders(filters?: OrderFilter): Promise<Order[]>

// অর্ডার বিস্তারিত
getOrder(id: string): Promise<Order>

// অর্ডার তৈরি
createOrder(data: OrderData): Promise<Order>

// অর্ডার আপডেট
updateOrder(id: string, data: OrderData): Promise<Order>

// অর্ডার স্ট্যাটাস আপডেট
updateOrderStatus(id: string, status: string): Promise<Order>

// অর্ডার ক্যান্সেল
cancelOrder(id: string): Promise<void>
```

### 6️⃣ **Payment সার্ভিস** (`payment.service.ts`)

```typescript
// পেমেন্ট শুরু করা
initiatePayment(planId: string): Promise<CheckoutSession>

// পেমেন্ট কনফার্ম করা
confirmPayment(sessionId: string): Promise<PaymentResponse>

// আমার পেমেন্ট
getMyPayments(): Promise<Payment[]>

// সব পেমেন্ট (Admin)
getAllPayments(): Promise<Payment[]>

// পেমেন্ট ডেটা পান
getPayment(id: string): Promise<Payment>
```

### 7️⃣ **Subscription সার্ভিস** (`subscription.service.ts`)

```typescript
// সাবস্ক্রিপশন প্ল্যান
getPlans(): Promise<SubscriptionPlan[]>

// আমার প্ল্যান
getMyPlan(): Promise<MySubscription>

// প্ল্যান আপগ্রেড
upgradePlan(planId: string): Promise<SubscriptionResponse>

// প্ল্যান ডাউনগ্রেড
downgradePlan(planId: string): Promise<SubscriptionResponse>

// সাবস্ক্রিপশন বাতিল
cancelSubscription(): Promise<void>
```

### 8️⃣ **Dashboard সার্ভিস** (`dashboard.service.ts`)

```typescript
// ড্যাশবোর্ড স্ট্যাটিস্টিক্স
getStats(): Promise<DashboardStats>

// রাজস্ব ডেটা
getRevenueData(period?: string): Promise<RevenueData>

// চার্ট ডেটা
getChartData(type: string): Promise<ChartData>

// সাম্প্রতিক অর্ডার
getRecentOrders(limit?: number): Promise<Order[]>
```

### 9️⃣ **Invoice সার্ভিস** (`invoice.service.ts`)

```typescript
// ইনভয়েস তালিকা
getInvoices(): Promise<Invoice[]>

// ইনভয়েস বিস্তারিত
getInvoice(id: string): Promise<Invoice>

// ইনভয়েস পিডিএফ ডাউনলোড
downloadInvoicePDF(id: string): Promise<Blob>
```

---

## হুক এবং ইউটিলিটি

### 🎣 কাস্টম হুক

#### 1. **useAuth** - অথেন্টিকেশন হুক
```typescript
const { 
  user,           // বর্তমান ইউজার
  isLoading,      // লোডিং স্ট্যাটাস
  login,          // লগইন ফাংশন
  logout,         // লগআউট ফাংশন
  register        // রেজিস্ট্রেশন ফাংশন
} = useAuth();
```

#### 2. **useShop** - শপ ডেটা হুক
```typescript
const { 
  shop,
  isLoading,
  updateShop,
  refetch
} = useShop();
```

#### 3. **usePayment** - পেমেন্ট হুক
```typescript
const { 
  payments,
  isLoading,
  initiatePayment,
  confirmPayment
} = usePayment();
```

#### 4. **useSubscription** - সাবস্ক্রিপশন হুক
```typescript
const { 
  plan,
  plans,
  upgradePlan,
  downgradePlan
} = useSubscription();
```

#### 5. **use-mobile** - মোবাইল ডিটেকশন
```typescript
const isMobile = useMobile();

// মোবাইল-স্পেসিফিক রেন্ডারিং
{isMobile && <MobileMenu />}
```

### 🛠️ ইউটিলিটি ফাংশন

#### 1. **authUtils.ts** - অথেন্টিকেশন সহায়ক
```typescript
// টোকেন পান
getToken(): string | null

// টোকেন সেট করুন
setToken(token: string): void

// টোকেন সরিয়ে দিন
removeToken(): void

// টোকেন বৈধ?
isTokenValid(): boolean
```

#### 2. **tokenUtils.ts** - টোকেন পার্সিং
```typescript
// JWT ডিকোড করুন
decodeToken(token: string): TokenPayload

// পেলোড পান
getTokenPayload(token: string): object
```

#### 3. **cookieUtils.ts** - কুকি ম্যানেজমেন্ট
```typescript
// কুকি পান
getCookie(name: string): string | null

// কুকি সেট করুন
setCookie(name: string, value: string): void

// কুকি সরিয়ে দিন
removeCookie(name: string): void
```

#### 4. **utils.ts** - সাধারণ ইউটিলিটি
```typescript
// ক্লাস মার্জ করুন
cn(...classes): string

// দাম ফর্ম্যাট করুন
formatPrice(price: number): string

// তারিখ ফর্ম্যাট করুন
formatDate(date: Date): string

// স্টাটাস রঙ পান
getStatusColor(status: string): string
```

#### 5. **imageUpload.utils.ts** - ছবি আপলোড
```typescript
// ছবি আপলোড করুন
uploadImage(file: File): Promise<string>

// ছবি সংকুচিত করুন
compressImage(file: File): Promise<Blob>

// ছবি ভ্যালিডেট করুন
validateImage(file: File): boolean
```

---

## ডেটা ফ্লো

### 🔄 ব্যবহারকারী প্রবাহ উদাহরণ: লগইন

```
1. ইউজার লগইন ফর্ম পূরণ করে
   ↓
2. LoginForm কম্পোনেন্ট ফর্ম ডেটা সংগ্রহ করে
   ↓
3. Zod স্কিমা ডেটা ভ্যালিডেট করে
   ↓
4. auth.service.ts → login() কল করা হয়
   ↓
5. API Request পাঠানো হয় (POST /api/v1/auth/login)
   ↓
6. ব্যাকএন্ড JWT টোকেন রিটার্ন করে
   ↓
7. tokenUtils.setToken() দিয়ে টোকেন সংরক্ষণ করা হয়
   ↓
8. AuthProvider স্টেট আপডেট হয়
   ↓
9. ইউজার ড্যাশবোর্ডে রিডিরেক্ট হয়
   ↓
10. সাফল্য বার্তা প্রদর্শিত হয়
```

### 🔄 পেমেন্ট প্রবাহ

```
1. ইউজার "চেকআউট করুন" ক্লিক করে
   ↓
2. payment.service.initiatePayment(planId) কল করা হয়
   ↓
3. ব্যাকএন্ড Stripe সেশন তৈরি করে
   ↓
4. চেকআউট URL রিটার্ন হয়
   ↓
5. ইউজার Stripe সাইটে রিডিরেক্ট হয়
   ↓
6. পেমেন্ট সম্পন্ন করে
   ↓
7. Stripe ওয়েবহুক ব্যাকএন্ডে পাঠায়
   ↓
8. শপ তৈরি হয়
   ↓
9. ইউজার সাফল্য পেজে রিডিরেক্ট হয়
   ↓
10. Dashboard.tsx কম্পোনেন্ট নতুন শপ ডেটা লোড করে
```

---

## অথেন্টিকেশন সিস্টেম

### 🔐 কীভাবে কাজ করে

#### 1. **সাইনআপ প্রক্রিয়া**
```
[ইউজার] → [রেজিস্ট্রেশন ফর্ম] → [ব্যাকএন্ড API]
                                    ↓
                            ডাটাবেসে ইউজার সংরক্ষণ
                            ShopOwnerProfile তৈরি
                            JWT টোকেন তৈরি
                                    ↓
                        [টোকেন রিটার্ন] → [ফ্রন্টএন্ড]
                                         ↓
                        localStorage-তে টোকেন সংরক্ষণ
                                         ↓
                        ড্যাশবোর্ডে রিডিরেক্ট
```

#### 2. **লগইন প্রক্রিয়া**
```
[ইউজার ইমেইল/পাসওয়ার্ড] → [API] → [Bcrypt যাচাইকরণ]
                                       ↓
                               JWT টোকেন তৈরি
                                       ↓
                        [টোকেন রিটার্ন] → [স্টোর করা হয়]
```

#### 3. **সুরক্ষিত রুট এক্সেস**

```tsx
// protected route উদাহরণ
export default function DashboardLayout({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'SHOP_OWNER') {
    redirect('/unauthorized');
  }

  return children;
}
```

#### 4. **টোকেন ম্যানেজমেন্ট**
- **সংরক্ষণ**: localStorage
- **হেডার সংযোজন**: প্রতিটি API রিকোয়েস্টে
- **রিফ্রেশ**: এক্সপায়ার হলে স্বয়ংক্রিয়ভাবে
- **প্রত্যাহার**: লগআউটে

### 🔑 টোকেন পেলোড

```typescript
{
  userId: "user-123",
  email: "user@example.com",
  role: "SHOP_OWNER",
  shopId: "shop-456",  // যদি প্রযোজ্য
  iat: 1716100000,
  exp: 1716186400     // 24 ঘন্টা পরে
}
```

---

## স্টেট ম্যানেজমেন্ট

### 📦 Context প্রোভাইডার

#### 1. **AuthProvider**
```tsx
// সরবরাহকৃত ডেটা:
{
  user: CurrentUser | null,
  isLoading: boolean,
  login: (email, password) => Promise,
  logout: () => void,
  register: (data) => Promise
}
```

#### 2. **ThemeProvider**
```tsx
// সরবরাহকৃত ডেটা:
{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}
```

#### 3. **NotificationProvider**
```tsx
// সরবরাহকৃত ডেটা:
{
  notify: (message, type) => void,
  success: (message) => void,
  error: (message) => void,
  info: (message) => void
}
```

---

## ফর্ম ভ্যালিডেশন (Zod)

### 📝 উদাহরণ: পণ্য স্কিমা

```typescript
// zod/product.schema.ts
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(3, 'নাম কমপক্ষে 3 অক্ষর হতে হবে'),
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'বৈধ SKU ফর্ম্যাট নয়'),
  price: z.number().positive('দাম ইতিবাচক হতে হবে'),
  description: z.string().optional(),
  image: z.string().url('বৈধ URL প্রদান করুন'),
  categoryId: z.string().uuid('বৈধ ক্যাটেগরি নির্বাচন করুন'),
  quantity: z.number().int().min(0, 'পরিমাণ অঋণাত্মক হতে হবে')
});

type CreateProductInput = z.infer<typeof CreateProductSchema>;
```

---

## পরিবেশ ভেরিয়েবল

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxx
NEXT_PUBLIC_APP_NAME=BillingSystem
NEXT_PUBLIC_APP_DESCRIPTION=E-commerce Billing & Shop Management
```

---

## বিল্ড এবং ডেপ্লয়মেন্ট কমান্ড

```bash
# ডেভেলপমেন্ট সার্ভার শুরু করুন
bun --bun next dev          # Localhost:3000

# প্রোডাকশন বিল্ড তৈরি করুন
bun --bun next build

# প্রোডাকশন সার্ভার শুরু করুন
bun --bun next start

# স্ট্যাটিক এক্সপোর্ট (যদি প্রয়োজন হয়)
bun --bun next export

# Lint চালান
npm run lint
```

---

## পারফরম্যান্স অপটিমাইজেশন

✅ **Image Optimization**: Next.js `Image` কম্পোনেন্ট  
✅ **Code Splitting**: ডায়নামিক ইম্পোর্ট  
✅ **Lazy Loading**: সাসপেন্স + ফলব্যাক  
✅ **Caching**: ব্রাউজার এবং সার্ভার-সাইড  
✅ **SEO**: মেটা ট্যাগ এবং স্ট্রাকচার্ড ডেটা  

---

## সিকিউরিটি ফিচার

🔒 **JWT টোকেন**: সুরক্ষিত অথেন্টিকেশন  
🔒 **HTTPS**: এনক্রিপ্টেড যোগাযোগ  
🔒 **CORS**: ক্রস-অরিজিন সুরক্ষা  
🔒 **Input ভ্যালিডেশন**: Zod দিয়ে  
🔒 **XSS প্রতিরোধ**: React স্বয়ংক্রিয় escaping  
🔒 **CSRF সুরক্ষা**: SameSite কুকি  

---

## মোবাইল রেসপন্সিভনেস

✅ Tailwind CSS রেসপন্সিভ ক্লাস  
✅ `use-mobile` হুক দিয়ে মোবাইল ডিটেকশন  
✅ HeroUI কম্পোনেন্ট রেসপন্সিভ ডিজাইন  
✅ নমনীয় লেআউট এবং নেভিগেশন  

---

## সাধারণ সমস্যা এবং সমাধান

### ❌ সমস্যা: টোকেন এক্সপায়ার হয়েছে

**সমাধান**: `tokenUtils.refreshToken()` স্বয়ংক্রিয়ভাবে কল করুন

### ❌ সমস্যা: API এরর পাচ্ছি

**সমাধান**: 
- কনসোলে দেখুন
- নেটওয়ার্ক ট্যাব চেক করুন
- ব্যাকএন্ড সার্ভার চলছে কিনা দেখুন

### ❌ সমস্যা: ড্যাশবোর্ড লোড হচ্ছে না

**সমাধান**:
- লগইন স্ট্যাটাস চেক করুন
- টোকেন বৈধ কিনা দেখুন
- ব্রাউজার কনসোল এরর দেখুন

---

## নতুন ফিচার যোগ করার ধাপ

1. **কম্পোনেন্ট তৈরি করুন**
   ```bash
   components/module/feature/FeatureName.tsx
   ```

2. **সার্ভিস তৈরি করুন**
   ```bash
   services/feature.service.ts
   ```

3. **Zod স্কিমা তৈরি করুন**
   ```bash
   zod/feature.schema.ts
   ```

4. **পেজ/রুট যোগ করুন**
   ```bash
   app/dashboard/feature/page.tsx
   ```

5. **নেভিগেশনে যোগ করুন**
   ```bash
   Sidebar.tsx বা Header.tsx আপডেট করুন
   ```

---

## 📞 সহায়তা এবং রেফারেন্স

- **Next.js ডকুমেন্টেশন**: https://nextjs.org/docs
- **React ডকুমেন্টেশন**: https://react.dev
- **HeroUI ডকুমেন্টেশন**: https://heroui.com
- **Tailwind CSS**: https://tailwindcss.com
- **Zod**: https://zod.dev

---

**ডকুমেন্ট সংস্করণ**: 1.0  
**শেষ আপডেট**: May 19, 2026  
**প্রস্তুতকারক**: AI Assistant
