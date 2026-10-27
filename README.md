<div align="center">

https://github.com/user-attachments/assets/bd180429-5daf-444c-842e-5caa5b7fb661

# 🌊 RippleUp — Campaign Amplification Platform

**Empower Important Messages to Reach Audiences Beyond Personal Networks**

[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-58.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql&logoColor=white)](https://supabase.com/)
[![Auth0](https://img.shields.io/badge/Auth0-JWT-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-02042B?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

</div>

## 📖 Table of Contents

- [About The Project](#-about-the-project)
  - [The Problem](#the-problem)
  - [The Solution](#the-solution)
  - [Core Concept: Amplification vs. Donation](#core-concept-amplification-vs-donation)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
  - [Mobile Application (`mobile/`)](#mobile-application-mobile)
  - [Backend API (`backend/`)](#backend-api-backend)
  - [Third-Party Services & Infrastructure](#third-party-services--infrastructure)
- [📐 System Architecture & Data Flow](#-system-architecture--data-flow)
- [📂 Project Structure](#-project-structure)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Mobile Application Setup](#3-mobile-application-setup)
- [⚙️ Environment Variables](#️-environment-variables)
  - [Backend Configuration (`backend/.env`)](#backend-configuration-backendenv)
  - [Mobile App Configuration (`mobile/.env`)](#mobile-app-configuration-mobileenv)
- [💳 Demo Mode & Testing Accounts](#-demo-mode--testing-accounts)
- [📡 API Reference Summary](#-api-reference-summary)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 About The Project

**RippleUp** is a community-funded message distribution and advertising amplification platform. Individuals, activists, creators, nonprofits, and community organizations frequently produce high-impact, verified messages—such as public health awareness, environmental protection, or education initiatives—that struggle to be seen because their personal follower count or marketing budget is limited.

### The Problem
Traditional social platforms throttle organic post reach, confining vital public interest messages within creators' existing echo chambers unless large advertising budgets are expended.

### The Solution
RippleUp democratizes paid media distribution. Backers pool micro-contributions directly toward transparent digital advertising and verified promotional channels (e.g. regional social feeds, YouTube, WhatsApp broadcasts, civic forums), expanding campaign reach exponentially.

### Core Concept: Amplification vs. Donation
> ⚠️ **Important Distinction:** RippleUp is **not** a traditional charity or donation platform.
> Contributions **never** go directly into the personal pockets of organizers. Instead, **95% of every contribution is directly allocated to verified ad distribution**, with a transparent **5% platform sustainability fee**, ensuring complete trust and measurable civic impact.

---

## ✨ Key Features

### 📱 Mobile-First Experience (10 Complete Screen Flows)
1. **Interactive Onboarding & Hero Splash**: Smooth branded splash screen (`SplashScreen.gif`), onboarding carousel with responsive image fitting and graceful fade-out transitions.
2. **Home Tab**: Featured campaign banners, real-time weekly reach metrics (e.g., *12.5K people reached*), quick start action triggers, and recent activity.
3. **Explore & Multi-Category Filtering**: Real-time keyword search with horizontal filter pills across 10 categories (*Environment, Education, Health, Science, Public Policy, Community, etc.*) and bookmarking.
4. **Campaign Deep-Dive**: Rich story presentations, transparency documentation, milestone progress bars, backer counts, and community endorsement voting.
5. **5-Step Campaign Creation Wizard**: Connected stepper flow:
   - **Step 1: Basics** — Title, category selection, summary with live character counters.
   - **Step 2: Story** — Full narrative, impact objectives, verified supporting sources & links.
   - **Step 3: Visuals** — Cover imagery, ad creatives, call-to-action hooks, live ad preview card.
   - **Step 4: Reach & Goal** — Target reach calculator with dynamic audience projections.
   - **Step 5: Review & Submit** — Pre-submission audit and validation.
6. **Autosave & Draft Management**: Auto-saving campaign drafts with instant continuation from the *My Campaigns* section.
7. **Transparent Contributions**: Presets (₹250, ₹500, ₹1,000, ₹2,500, ₹5,000) or custom amounts with live reach impact estimators (`~25 people per ₹1 contributed`).
8. **Razorpay Checkout & Verified Receipts**: Integrated payment sheet with instant success state, printable receipts, and contribution histories.
9. **Impact & Distribution Reports**: Public post-campaign transparency analytics: ad impressions, link clicks, engagement metrics, and geographic distribution.
10. **Offline Resilience & Safe-Area Protection**: Automatic network connectivity sensing (`NetInfo`) with offline retry overlays and full dynamic safe area insets for modern edge-to-edge screens.

---

## 🛠️ Tech Stack

### Mobile Application (`mobile/`)
| Layer | Technologies |
|---|---|
| **Framework** | [React Native 0.88](https://reactnative.dev/), [React 19](https://react.dev/), [Expo SDK 58](https://expo.dev/) |
| **Routing** | [Expo Router v4](https://docs.expo.dev/router/introduction/) (File-based routing with typed routes) |
| **Design System** | Custom Emerald Design System (`#059669`, `#10B981`, `#111827`, pure white surfaces, rounded cards, full pill badges) |
| **Icons** | [lucide-react-native](https://lucide.dev/) |
| **Animations** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), React Native `Animated` API |
| **Images & Media** | [expo-image](https://docs.expo.dev/versions/latest/sdk/image/), [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/image-picker/) |
| **State Management** | React Context (`AuthContext` with Auth0 + Demo user switching, `DraftContext` with autosave) |
| **Storage & Network** | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/), [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo), Axios |
| **Safe Areas & Layout** | [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context), [react-native-screens](https://github.com/software-mansion/react-native-screens) |

### Backend API (`backend/`)
| Layer | Technologies |
|---|---|
| **Runtime & Language** | [Node.js v20+](https://nodejs.org/) (ES Modules), [TypeScript 5.8+](https://www.typescriptlang.org/) |
| **Framework** | [Express.js 5.3](https://expressjs.com/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/), [Prisma ORM v7](https://www.prisma.io/) (`@prisma/client`, `@prisma/adapter-pg`) |
| **Authentication** | [Auth0](https://auth0.com/) RS256 JWT Verification (`express-oauth2-jwt-bearer`) + Seeded Demo Account bypass |
| **Validation** | [Zod v4](https://zod.dev/) (Strict type-safe schema validation on params, query, and request body) |
| **Payments** | [Razorpay SDK](https://razorpay.com/) (Order creation, webhook signature verification, mock demo mode) |
| **Security** | [Helmet](https://helmetjs.github.io/), CORS, [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), Timing-safe HMAC signatures |
| **File Handling** | [Multer](https://github.com/expressjs/multer) with local static disk delivery |
| **Testing** | [Vitest](https://vitest.dev/), [Supertest](https://github.com/ladjs/supertest) |

### Third-Party Services & Infrastructure
- **Database**: Supabase Managed PostgreSQL
- **Auth Provider**: Auth0 Universal Login / OAuth 2.0
- **Payments**: Razorpay Gateway (Test & Live modes)
- **Deployment**: Vercel Serverless Function (`backend/`) & Expo Application Services (EAS Build / Web)

---

## 📐 System Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────┐
│               RippleUp Mobile Application              │
│       (Expo SDK 58 / React Native / TypeScript)        │
└──────────┬─────────────────────────────────┬───────────┘
           │ HTTP REST Requests (Axios)      │ Auth0 Login / Demo Switcher
           ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│                 Express.js Backend API                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Middlewares: Helmet, CORS, Rate Limit, Auth0 JWT │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Zod Schemas & Domain Modules:                    │  │
│  │ • Campaigns (5-Step Wizard & Discovery)          │  │
│  │ • Contributions & Razorpay Lifecycle             │  │
│  │ • Activity & Notifications                       │  │
│  │ • Reports, Feedback & File Uploads               │  │
│  └──────────────────────────────────────────────────┘  │
└──────────┬────────────────────────┬────────────────────┘
           │ Prisma v7 (PrismaPg)   │ Webhooks / API
           ▼                        ▼
┌───────────────────────┐ ┌──────────────────────────────┐
│  PostgreSQL Database  │ │    Third-Party Services      │
│      (Supabase)       │ │  • Auth0 (JWT Tokens)        │
│                       │ │  • Razorpay (Payments)       │
└───────────────────────┘ └──────────────────────────────┘
```

---

## 📂 Project Structure

```text
campaign-amplification/
├── backend/                        # Node.js + Express API
│   ├── prisma/
│   │   ├── migrations/             # Versioned SQL migrations
│   │   ├── schema.prisma           # Prisma v7 relational schema
│   │   └── seed.ts                 # Idempotent demo campaign seeder
│   ├── src/
│   │   ├── config/                 # Zod validated environment settings
│   │   ├── lib/                    # Prisma client & Razorpay instances
│   │   ├── middleware/             # Auth0 JWT, validation, error handlers
│   │   ├── modules/
│   │   │   ├── activity/           # Notification feeds & read markers
│   │   │   ├── campaigns/          # Discovery, 5-step wizard, progress
│   │   │   ├── contributions/      # Checkout, order creation, verification
│   │   │   ├── feedback/           # Community endorsement voting
│   │   │   ├── health/             # /health and /ready probes
│   │   │   ├── reports/            # Transparency & ad distribution analytics
│   │   │   ├── saved-campaigns/    # Bookmarking endpoints
│   │   │   ├── uploads/            # Multipart image upload handlers
│   │   │   └── users/              # Profiles, creator & backer histories
│   │   ├── app.ts                  # Express application factory
│   │   └── server.ts               # Server bootstrap & graceful shutdown
│   ├── tests/                      # Vitest unit & integration test suites
│   ├── vercel.json                 # Vercel serverless deployment config
│   └── package.json
│
├── mobile/                         # Expo SDK 58 Mobile Application
│   ├── assets/                     # Splash images, logos, icons, fonts
│   ├── src/
│   │   ├── api/                    # Axios API client & domain service layers
│   │   ├── app/                    # Expo Router file-based navigation
│   │   │   ├── (tabs)/             # 5 Core Tabs: Home, Explore, Create, Activity, Profile
│   │   │   ├── campaign/           # Details ([id]), Contribute, Success, Report
│   │   │   ├── create/             # 5-Step Stepper Wizard ([step]) & Preview
│   │   │   ├── user/               # My Campaigns, Contributions, Saved
│   │   │   └── _layout.tsx         # Root layout with Splash, Offline & Safe Areas
│   │   ├── components/
│   │   │   ├── campaign/           # Large card, row card, stats badges
│   │   │   ├── common/             # Button, Badge, Input, HeaderBar, Stepper
│   │   │   └── creation/           # Image dropzones, source lists, ad previews
│   │   ├── constants/              # Emerald theme design tokens, API configs
│   │   └── context/                # AuthContext (Auth0/Demo) & DraftContext
│   ├── app.json                    # Expo project configuration
│   └── package.json
│
├── docs/                           # Architecture specs & implementation plans
│   └── implementation-plan.md
├── LICENSE                         # MIT License
└── README.md                       # Master Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Expo Go App** (optional, for running on a physical phone) or Android Studio / Xcode Simulator
- **PostgreSQL**: Local instance or free [Supabase](https://supabase.com/) account

---

### 1. Clone Repository
```bash
git clone https://github.com/TejasShirsath/campaign-amplification.git
cd campaign-amplification
```

---

### 2. Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Fill in your DATABASE_URL in backend/.env

# 3. Generate Prisma client & apply database migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Seed database with sample campaigns and demo users
npm run prisma:seed

# 5. Start the development server
npm run dev
```

The backend server will start on `http://localhost:5000`. You can test health by visiting:
```bash
curl http://localhost:5000/health
```

---

### 3. Mobile Application Setup

Open a new terminal window:

```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Start the Expo development server
npx expo start
```

#### Running on Devices:
- **Web**: Press `w` in the terminal to open in your browser (`http://localhost:8081`).
- **Android Emulator**: Press `a` (requires Android Studio).
- **iOS Simulator**: Press `i` (macOS only, requires Xcode).
- **Physical Phone**: Scan the terminal QR code using **Expo Go** (Android) or the Camera app (iOS).
  > *Note: For physical devices, set `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000/api/v1` in `mobile/.env` so the phone can reach your computer's local backend.*

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Port for the Express server | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:...@db.supabase.co:5432/postgres` |
| `AUTH0_DOMAIN` | Auth0 tenant domain | `dev-xxxx.us.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API identifier | `https://dev-xxxx.us.auth0.com/api/v2/` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_secret_here` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for webhook signature check | `your_webhook_secret` |
| `DEMO_PAYMENT_MODE` | Simulates Razorpay verification when `true` | `true` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

### Mobile App Configuration (`mobile/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:5000/api/v1` |
| `EXPO_PUBLIC_AUTH0_DOMAIN` | Auth0 tenant domain | `dev-xxxx.us.auth0.com` |
| `EXPO_PUBLIC_AUTH0_CLIENT_ID`| Auth0 Native Client ID | `your_client_id` |
| `EXPO_PUBLIC_AUTH0_AUDIENCE` | Auth0 API identifier | `https://dev-xxxx.us.auth0.com/api/v2/` |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID`| Razorpay public test key | `rzp_test_xxxxxxxx` |

---

## 💳 Demo Mode & Testing Accounts

To allow immediate, friction-free testing without requiring users to configure Auth0 accounts or input real credit card credentials, the platform includes built-in **Demo Capabilities**:

### 1. Instant Demo User Switching
Navigate to the **Profile** tab in the mobile app and tap **Switch Account**:
- **Demo Creator (`demo-creator`)**: Has pre-seeded active campaigns, draft campaigns, and creation permissions.
- **Demo Backer (`demo-backer`)**: Has a contribution history, saved campaigns, and activity notifications.

### 2. Zero-Credential Demo Payments
When `DEMO_PAYMENT_MODE=true` is set in `backend/.env`, the checkout flow will automatically mock Razorpay order creation and backend signature verification, allowing you to experience the complete payment lifecycle, receipt generation, and funding progress updates instantly.

---

## 📡 API Reference Summary

All API endpoints are prefixed with `/api/v1`:

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | Server uptime & readiness probe | No |
| **Campaigns** | `GET` | `/campaigns` | Search, filter by category, sort campaigns | No |
| | `GET` | `/campaigns/featured` | Fetch spotlighted featured campaigns | No |
| | `GET` | `/campaigns/:id` | Get campaign detail with creator info | No |
| | `GET` | `/campaigns/:id/progress` | Get funding & reach statistics | No |
| | `POST` | `/campaigns` | Create a new campaign draft | Yes |
| | `PUT` | `/campaigns/:id/basics` | Update Step 1 (Title, category, summary) | Yes |
| | `PUT` | `/campaigns/:id/story` | Update Step 2 (Story blocks, sources) | Yes |
| | `PUT` | `/campaigns/:id/visuals` | Update Step 3 (Ad copy, media, CTA) | Yes |
| | `PUT` | `/campaigns/:id/reach` | Update Step 4 (Funding goal, target reach) | Yes |
| | `POST` | `/campaigns/:id/submit` | Step 5: Submit campaign for review | Yes |
| **Contributions**| `POST`| `/campaigns/:id/contributions`| Initiate contribution & create Razorpay order | Optional |
| | `POST` | `/payments/razorpay/verify` | Verify payment signature & finalize backer | Optional |
| | `GET` | `/contributions/:id` | Fetch contribution receipt details | Yes |
| **Activity** | `GET` | `/activity/notifications` | Fetch user notification feed | Yes |
| | `POST` | `/activity/notifications/read-all`| Mark all notifications as read | Yes |
| **Reports** | `GET` | `/campaigns/:id/report` | Fetch distribution & ad reach analytics | No |
| **Feedback** | `POST` | `/campaigns/:id/feedback` | Submit community relevance vote | Optional |
| **Uploads** | `POST` | `/uploads` | Upload campaign cover or creative image | Yes |
| **Users** | `GET` | `/users/me` | Current authenticated user profile | Yes |
| | `GET` | `/users/me/campaigns` | List user's created campaigns & drafts | Yes |
| | `GET` | `/users/me/contributions` | List user's contribution history | Yes |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/TejasShirsath">Tejas Shirsath</a> for the Campaign Amplification Hackathon</sub>
</div>
