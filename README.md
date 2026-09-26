# 🍦 Five-orites Scoop

**Premium Ice Cream E-Commerce + Real-Time Inventory Management System**

> *"Premium ice cream, scooped to your door"*

---

## Project Overview

Five-orites Scoop is a production-grade cross-platform mobile/web application built with **Ionic 7 + Angular 17 + Firebase**. It enables customers to browse 64 ice cream flavors, order by size, track orders in real time, and receive push notifications — while giving store admins a live inventory and fulfillment dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Ionic 7 + Angular 17 (Standalone Components) |
| Native | Capacitor 5 (iOS + Android) |
| Backend | Firebase Firestore + Firebase Auth |
| State | RxJS BehaviorSubject + Angular Signals |
| Styling | SCSS + Ionic CSS Variables |
| Language | TypeScript 5 (strict mode) |
| Currency | Philippine Peso (₱) |

---

## Features

### Customer
- Browse **64 premium ice cream flavors** across 8 flavor sets
- Filter by flavor set, search by name, toggle in-stock only
- Select size: **Cup · Pint · Half Gallon · Gallon**
- Add to cart, adjust quantity, checkout with delivery address
- **Real-time order status tracker** (Pending → Preparing → Delivered)
- Voucher codes (e.g. `SCOOP10`, `FREE50`), saved address book, wishlist, and
  product reviews
- In-app toasts on status change while the tracker is open (see the honest
  note on notifications below)
- Google Sign-In + Email/Password authentication

### Admin
- **Inventory Manager**: Live stock view per product/size; inline edit with atomic Firestore updates
- **Order Fulfillment**: Filter orders by status, expand detail panel, advance order stages
- **Sales Analytics**: Revenue KPIs, delivered order count, top flavors by units sold, CSV export
- **Low stock alerts**: Live dashboard banner when any SKU drops below threshold
- Role-based access via a `role` field on the user's Firestore document
  (`users/{uid}`), enforced by `firestore.rules` — **not** Firebase Auth
  custom claims, which are not used anywhere in this project

---

## Known limitations (please read before demoing)

These are real constraints of the current build, documented here so the claims
above are not mistaken for more than they are.

- **Notifications are in-app only.** `NotificationService` shows a toast and a
  browser notification, but it is invoked by the client that *performs* the
  status change. A customer is only notified while they have the order tracker
  open. True background push requires Firebase Cloud Functions, which are not
  deployed (see "Out of Scope").
- **No payment gateway.** Every order is written with `paymentStatus: 'pending'`
  and stays that way. Revenue figures count *delivered* orders, not paid ones.
- **Analytics and dashboard totals read at most 100 orders**, the cap in
  `OrderService.getAllOrders()`. Figures are correct but will under-report once
  the shop passes 100 orders.
- **Stock is decremented client-side.** The order flow validates and decrements
  stock, then writes the order, and rolls the decrement back if the write fails.
  This is correct for the app in use, but Firestore security rules cannot
  require a stock change to accompany an order — a determined user with the
  Firebase SDK could write an order document directly. Only Cloud Functions can
  close that gap.
- **Voucher discounts are resolved server-of-record from Firestore**, not taken
  from the client. Rules additionally clamp `discountAmount` to the subtotal.

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          ← product, order, user, cart interfaces
│   │   ├── services/        ← auth, cart, inventory, order, notification
│   │   ├── guards/          ← authGuard, adminGuard
│   │   └── config/          ← pricing.config.ts (authoritative price matrix)
│   ├── shared/
│   │   ├── components/      ← ProductCard, OrderStatusBadge, StarRating
│   │   └── pipes/           ← PesoPipe, StockStatusPipe
│   ├── features/
│   │   ├── auth/            ← Login, Register, Google Sign-In
│   │   ├── dashboard/       ← Role-aware hub (customer + admin views)
│   │   ├── products/        ← Catalog + Product Detail
│   │   ├── cart/            ← Cart + Checkout flow
│   │   ├── orders/          ← Order history + Live tracker
│   │   ├── about/           ← App overview
│   │   └── developers/      ← Team credits
│   └── admin/
│       ├── inventory/       ← Stock management CRUD
│       ├── orders/          ← Fulfillment dashboard
│       └── analytics/       ← Sales reports
├── environments/            ← Firebase config (dev + prod)
└── theme/
    └── variables.scss       ← Brand design tokens
scripts/
└── seed-products.ts         ← Firestore seed script (64 SKUs)
```

---

## Getting Started

### Prerequisites
- Node.js 20+ (see `.nvmrc`)
- npm 9+
- Firebase project with Firestore + Authentication enabled

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Copy `src/environments/environment.example.ts` over
`src/environments/environment.ts` and fill in your Firebase project credentials.
`environment.prod.ts` is substituted automatically for production builds via
`fileReplacements` in `angular.json` — you do not need to edit it by hand.

### 3. Seed the Product Catalog
Place your Firebase service account key at `scripts/serviceAccountKey.json`, then:
```bash
npm run seed
```
This writes all **64 product documents** to Firestore with default stock levels.
Use `npm run seed:preserve-stock` to keep existing stock counts.

### 4. Deploy Firestore Security Rules + Indexes
```bash
firebase deploy --only firestore
```

### 5. Run in Browser
```bash
npm start
```

### 6. Verify the Build
```bash
npm run typecheck     # tsc --noEmit, no Angular deps needed
npm run test:logic    # business-logic unit tests (node:test via tsx)
npm run build         # production bundle -> www/browser
```

Note: the build output is `www/browser`, which is what both `firebase.json`
and `capacitor.config.ts` point at.

### 7. Build for Android / iOS
```bash
npm run build:android
npm run build:ios
```

---

## Project Commands

| Command | What it does |
|---|---|
| `npm start` | Dev server |
| `npm run build` | Production bundle to `www/browser` |
| `npm run typecheck` | `tsc --noEmit` against the app tsconfig |
| `npm run test:logic` | Unit tests for pricing, delivery, vouchers, stock, ratings |
| `npm run seed` | Seed 64 products (add `seed:preserve-stock` to keep stock) |

There is deliberately no `test` or `lint` script: `angular.json` defines no
such targets, so `ng test` / `ng lint` would fail. Add the targets before
adding the scripts back.

---

## Product Catalog (64 SKUs)

| Set | Name | Count |
|---|---|---|
| 1 | Chocolates | 8 varieties |
| 2 | Vanilla | 8 varieties |
| 3 | Strawberry | 8 varieties |
| 4 | Mango | 8 varieties |
| 5 | Ube | 8 varieties |
| 6 | Mint | 8 varieties |
| 7 | Coffee | 8 varieties |
| 8 | Cookies & Cream | 8 varieties |

---

## Pricing Matrix

| Set | Cup | Pint | Half Gallon | Gallon |
|---|---|---|---|---|
| Chocolates (1) | ₱65 | ₱200 | ₱500 | ₱950 |
| Vanilla (2) | ₱60 | ₱190 | ₱480 | ₱900 |
| Strawberry (3) | ₱65 | ₱200 | ₱500 | ₱950 |
| Mango (4) | ₱65 | ₱200 | ₱500 | ₱950 |
| Ube (5) | ₱70 | ₱210 | ₱520 | ₱980 |
| Mint (6) | ₱65 | ₱200 | ₱500 | ₱950 |
| Coffee (7) | ₱70 | ₱210 | ₱520 | ₱980 |
| Cookies & Cream (8) | ₱65 | ₱200 | ₱500 | ₱950 |

---

## The Team

| Name | Roles |
|---|---|
| **Kenn Karlo Umadhay** | Main Project Lead · Full Stack Dev · UI/UX Designer Lead · QA · Documentation |
| **Heaven Alvior** | QA · Documentation |
| **Justin Curby P. Esguerra** | Full Stack Dev · UI/UX Designer · QA · Documentation |
| **Renz Gabriel De la Cruz** | QA · Documentation |
| **Antonio Miguel Villanueva** | Full Stack Dev · UI/UX Designer · QA · Documentation |

---

## Out of Scope (Future Phases)

- **Firebase Cloud Functions** — needed for real background push notifications,
  and for enforcing stock decrements server-side (see Known Limitations)
- **Payment gateway integration** (PayMongo / Paymaya webhook handlers)
- **Server-side analytics aggregation** — current figures are computed on the
  client from a capped query
- CSV bulk product import
- App Store / Play Store deployment pipeline

---

## Testing

`npm run test:logic` runs the business-logic suite with `node:test` via `tsx`.
The tests import the real implementations from `src/app/core/logic/`, which is
deliberately free of Angular and Firebase imports.

**Do not inline logic in the test file.** The original version of this suite
re-implemented every rule by hand, so it would have kept passing even if the
app's own implementation were deleted — it proved nothing.

---

*Five-orites Scoop © 2025 — Built with Ionic · Angular · Firebase*
