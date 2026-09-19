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
- Push notifications for every status change
- Google Sign-In + Email/Password authentication

### Admin
- **Inventory Manager**: Live stock view per product/size; inline edit with atomic Firestore updates
- **Order Fulfillment**: Filter orders by status, expand detail panel, advance order stages
- **Sales Analytics**: Revenue KPIs, delivered order count, top flavors by units sold
- **Low stock alerts**: Live dashboard banner when any SKU drops below threshold
- Role-based access via Firebase Auth custom claims

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
- Node.js 18+
- npm 9+
- Angular CLI: `npm install -g @angular/cli`
- Ionic CLI: `npm install -g @ionic/cli`
- Firebase project with Firestore + Authentication enabled

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Edit `src/environments/environment.ts` with your Firebase project credentials:
```typescript
firebase: {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  // ...
}
```

### 3. Seed the Product Catalog
Place your Firebase service account key at `scripts/serviceAccountKey.json`, then:
```bash
npm run seed
```
This writes all **64 product documents** to Firestore with default stock levels.

### 4. Deploy Firestore Security Rules + Indexes
```bash
firebase deploy --only firestore
```

### 5. Run in Browser
```bash
ionic serve
```

### 6. Build for Android / iOS
```bash
npm run build:android
npm run build:ios
```

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

- Firebase Cloud Functions (push notification triggers, stock alert webhooks)
- Payment gateway integration (PayMongo / Paymaya webhook handlers)
- CSV bulk product import
- Analytics data aggregation jobs
- App Store / Play Store deployment pipeline

---

*Five-orites Scoop © 2025 — Built with Ionic · Angular · Firebase*
