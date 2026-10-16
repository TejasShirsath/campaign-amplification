# Campaign Amplification Platform — Backend API

Production-ready backend for the **Campaign Amplification Platform**, built with Node.js, Express, TypeScript, Prisma v7, Supabase PostgreSQL, Auth0, and Razorpay.

The platform is a community-funded message distribution service. Backers pool contributions toward promotion and distribution costs to amplify verified campaigns beyond their creators' immediate networks.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js v20+ (ESM modules)
- **Framework**: Express.js with TypeScript (strict mode)
- **Database & ORM**: PostgreSQL (Supabase) with Prisma ORM v7 & `@prisma/adapter-pg`
- **Authentication**: Auth0 JWT access token validation (`express-oauth2-jwt-bearer`)
- **Payments**: Razorpay Node.js SDK (with demo payment mode for zero-credential development)
- **Validation**: Zod v4 schemas for request bodies, params, and queries
- **Security**: Helmet headers, CORS, rate limiting, timing-safe signature verification
- **Testing**: Vitest, Supertest

### Architecture Overview

Modular monolith structure:
```text
backend/
├── prisma/
│   ├── schema.prisma               # Prisma v7 datamodel with all relations and indexes
│   ├── migrations/                 # Versioned SQL migrations
│   └── seed.ts                     # Safe, idempotent demo seed data (8 campaigns)
├── src/
│   ├── app.ts                      # Express app factory with middleware & error handling
│   ├── server.ts                   # Server bootstrap with graceful shutdown
│   ├── config/                     # Environment variable validation (Zod)
│   ├── lib/                        # Prisma client (PrismaPg adapter) & Razorpay instance
│   ├── middleware/                 # Auth0 JWT, Zod validator, error & not-found handlers
│   ├── modules/
│   │   ├── activity/               # Notifications & campaign event feeds
│   │   ├── campaigns/              # 5-step campaign creation, drafts, discovery & progress
│   │   ├── contributions/          # Backer contributions & Razorpay order/webhook lifecycle
│   │   ├── feedback/               # Visual engagement & message impact community votes
│   │   ├── health/                 # Health check (/health) and database readiness (/ready)
│   │   ├── reports/                # Distribution & reach transparency reports
│   │   ├── saved-campaigns/        # Bookmarking campaigns
│   │   └── users/                  # User profile, owned campaigns, backer history
│   └── utils/                      # Custom ApiError, standardized response format, pagination
├── tests/                          # Automated Vitest test suites
├── prisma.config.ts                # Prisma 7 configuration file
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- PostgreSQL database (Supabase instance)

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Configuration
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Configure your `.env` variables:
```env
PORT=5000
NODE_ENV=development

# Database (Supabase PostgreSQL Connection String)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Auth0 Configuration
AUTH0_DOMAIN="your-tenant.us.auth0.com"
AUTH0_AUDIENCE="https://your-api-audience"

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID="rzp_test_YOUR_KEY_ID"
RAZORPAY_KEY_SECRET="YOUR_KEY_SECRET"
RAZORPAY_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"

# Development & CORS
CORS_ORIGIN="*"
DEMO_PAYMENT_MODE=true
```

> **Note on `DEMO_PAYMENT_MODE`**: When set to `true`, creating a contribution automatically produces a simulated Razorpay order ID and checkout payload, allowing the mobile application to be fully tested end-to-end even before configuring Razorpay production secrets.

### 4. Database Setup & Migrations
Prisma v7 uses `prisma.config.ts` for database connection:
```bash
# Generate the Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate:deploy

# Seed sample campaigns and demo accounts
npm run prisma:seed
```

### 5. Running the Application
```bash
# Start in development mode with live reload
npm run dev

# Run type check
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

### 6. Running Tests
```bash
npm test
```

---

## 📚 API Reference (`/api/v1`)

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Paginated Success:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [ ... ]
  }
}
```

---

### Core Endpoints

#### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Liveness status & uptime |
| `GET` | `/ready` | No | PostgreSQL database readiness probe |

#### Discovery & Browsing (No Login Required)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/campaigns` | Optional | Feed with pagination, search, category, sort |
| `GET` | `/api/v1/campaigns/featured` | No | Top featured campaigns |
| `GET` | `/api/v1/campaigns/:id` | Optional | Campaign detail, story, creatives, & reach |
| `GET` | `/api/v1/campaigns/:id/progress` | No | Funding progress (percent, total, days left) |
| `GET` | `/api/v1/campaigns/:id/feedback` | No | Aggregated community feedback summary |
| `GET` | `/api/v1/campaigns/:id/report` | Optional | Distribution report (public for completed) |

#### 5-Step Campaign Creation Flow
| Step | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| 0 | `POST` | `/api/v1/campaigns` | Yes | Initialize new campaign draft |
| 1 | `PUT` | `/api/v1/campaigns/:id/basics` | Yes | Update Step 1: title, category, creator |
| 2 | `PUT` | `/api/v1/campaigns/:id/story` | Yes | Update Step 2: headline, story blocks, sources |
| 3 | `PUT` | `/api/v1/campaigns/:id/visuals` | Yes | Update Step 3: ad creatives & images |
| 4 | `PUT` | `/api/v1/campaigns/:id/reach` | Yes | Update Step 4: target locations, duration |
| 5 | `POST` | `/api/v1/campaigns/:id/submit` | Yes | Step 5: funding goal, terms agreement & submit |
| Preview | `GET` | `/api/v1/campaigns/:id/preview` | Yes | Creator preview before/after submission |
| Draft | `PATCH` | `/api/v1/campaigns/:id` | Yes | Partial update / save draft state |

#### Contributions & Payments (Razorpay)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/campaigns/:id/contributions` | Yes | Create contribution & Razorpay order |
| `GET` | `/api/v1/contributions/:id` | Yes | Contribution details & receipt |
| `POST` | `/api/v1/payments/razorpay/verify` | Yes | Verify checkout payment signature |
| `POST` | `/api/v1/webhooks/razorpay` | No | Razorpay webhook (HMAC raw body verification) |

#### Activity & User Profile
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Yes | Current user profile |
| `PATCH` | `/api/v1/users/me` | Yes | Update display name, avatar, bio |
| `GET` | `/api/v1/users/me/campaigns` | Yes | Campaigns created by current user |
| `GET` | `/api/v1/users/me/contributions` | Yes | Backer payment history |
| `GET` | `/api/v1/users/me/saved-campaigns` | Yes | Bookmarked campaigns |
| `POST` | `/api/v1/campaigns/:id/save` | Yes | Save / bookmark campaign |
| `DELETE` | `/api/v1/campaigns/:id/save` | Yes | Remove saved campaign |
| `GET` | `/api/v1/campaigns/:id/saved` | Yes | Check if campaign is saved by user |
| `POST` | `/api/v1/campaigns/:id/feedback` | Yes | Submit community feedback vote |
| `GET` | `/api/v1/activity/notifications` | Yes | Notifications feed |
| `GET` | `/api/v1/activity/notifications/unread-count` | Yes | Unread notifications count |
| `PATCH` | `/api/v1/activity/notifications/:id/read` | Yes | Mark single notification as read |
| `POST` | `/api/v1/activity/notifications/read-all` | Yes | Mark all notifications as read |
| `GET` | `/api/v1/activity/campaigns/:id/events` | No | Public activity timeline of a campaign |

---

## 📱 Mobile App (Expo) Integration Guide

### Authentication
Send the Auth0 Bearer token in the `Authorization` header:
```typescript
const response = await fetch('http://YOUR_SERVER:5000/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

### Contribution & Checkout Flow
1. User enters contribution amount in the mobile app (e.g. ₹500 = `50000` paise).
2. Mobile calls:
   ```typescript
   POST /api/v1/campaigns/:id/contributions
   Body: { amountPaise: 50000, isAnonymous: true }
   ```
3. Backend returns order details:
   ```json
   {
     "success": true,
     "data": {
       "contributionId": "...",
       "orderId": "order_...",
       "amountPaise": 50000,
       "platformFeePaise": 2500,
       "totalPaise": 52500,
       "currency": "INR",
       "keyId": "rzp_test_..."
     }
   }
   ```
4. Mobile opens Razorpay checkout using `orderId`, `keyId`, and `totalPaise`.
5. Upon successful checkout, mobile sends the verification payload to backend:
   ```typescript
   POST /api/v1/payments/razorpay/verify
   Body: {
     razorpayOrderId: response.razorpay_order_id,
     razorpayPaymentId: response.razorpay_payment_id,
     razorpaySignature: response.razorpay_signature
   }
   ```
6. Backend cryptographically verifies the signature, confirms the contribution record, updates total raised and contributor counts atomically, and triggers backer milestone notifications.
