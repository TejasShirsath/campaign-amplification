# CampaignAmp Mobile Application — Implementation Plan

## Executive Summary
This implementation plan guides the end-to-end development of the **CampaignAmp** mobile application (Expo SDK 58, React Native, TypeScript). The visual and UX design strictly adheres to the 10-screen reference design provided in the project specification, enforcing **light mode only**, clean white surfaces, restrained emerald-green accents (`#059669` / `#10B981`), dark primary buttons (`#111827`), modern typography, rounded cards, and minimalist outline icons from Lucide.

The app interfaces directly with the live Campaign Amplification Platform REST API running on `http://localhost:5000` (or configured host), supporting both live Auth0 JWT tokens and seeded demo account tokens (`demo-user`, `demo-backer`), along with Razorpay checkout and backend-verified demo payments.

---

## 1. Project Architecture & Current State Analysis

### Current Codebase
- **Mobile Path**: `mobile/`
- **Framework**: Expo SDK 58 with Expo Router v4 (`expo-router: ~58.0.23`), React 19, React Native 0.88.
- **Backend Path**: `backend/`
- **Backend API Status**: Healthy and tested (`GET /health` = 200, `GET /api/v1/campaigns` returns populated campaigns).
- **Backend Auth Architecture**: Supports Auth0 RS256 JWT tokens AND seamless Demo tokens (`Bearer demo-creator` / `demo-backer`).
- **Payment Architecture**: Razorpay integration with automated demo payment verification mode (`DEMO_PAYMENT_MODE=true`).

### File Structure Strategy
```
mobile/
├── assets/
│   ├── images/
│   └── fonts/
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios/fetch API client with Auth0 / Demo token interceptors
│   │   ├── campaigns.ts          # Discovery, details, progress, reports, save
│   │   ├── creation.ts           # 5-step draft creation, autosave, submission
│   │   ├── contributions.ts      # Checkout, orders, Razorpay verification
│   │   ├── activity.ts           # Notifications, activity feeds, mark-read
│   │   └── user.ts               # Me profile, user campaigns, contributions, saved
│   ├── constants/
│   │   ├── theme.ts              # Emerald design system tokens (colors, radii, shadows, spacing)
│   │   └── config.ts             # API Base URL, Auth0 config, Razorpay keys
│   ├── context/
│   │   ├── auth-context.tsx      # Auth0 + Demo user switching state
│   │   └── draft-context.tsx     # 5-step campaign creation draft & autosave provider
│   ├── components/
│   │   ├── common/
│   │   │   ├── button.tsx        # Dark primary, ghost, outline, subtle emerald buttons
│   │   │   ├── badge.tsx         # Category pills & status tags
│   │   │   ├── input.tsx         # Clean bordered inputs & textareas with char counters
│   │   │   ├── progress-bar.tsx  # Smooth rounded emerald progress indicators
│   │   │   ├── metric-card.tsx   # Stat boxes with icons & trends
│   │   │   └── empty-state.tsx   # Clean state placeholders
│   │   ├── campaign/
│   │   │   ├── campaign-card-large.tsx    # Home featured card matching reference
│   │   │   ├── campaign-card-row.tsx      # Explore horizontal thumbnail card matching reference
│   │   │   └── campaign-stat-badge.tsx    # Backer, days, and reach badges
│   │   ├── layout/
│   │   │   ├── screen-container.tsx       # Safe-area wrapped light container with pull-to-refresh
│   │   │   └── header-bar.tsx             # Clean minimalist headers with action buttons
│   │   └── creation/
│   │       └── step-stepper.tsx           # 1-5 connected numbered stepper bar
│   ├── app/                      # Expo Router navigation tree
│   │   ├── _layout.tsx           # Root provider layout (Strict Light Theme)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # 5 bottom tabs: Home, Explore, Create, Activity, Profile
│   │   │   ├── index.tsx         # Tab 1: Home (Screen 1 in reference)
│   │   │   ├── explore.tsx       # Tab 2: Explore (Screen 2 in reference)
│   │   │   ├── create.tsx        # Tab 3: Create redirect / launcher
│   │   │   ├── activity.tsx      # Tab 4: Activity (Screen 6 in reference)
│   │   │   └── profile.tsx       # Tab 5: Profile (Screen 7 in reference)
│   │   ├── campaign/
│   │   │   ├── [id].tsx          # Screen 3: Campaign Detail
│   │   │   ├── contribute.tsx    # Screen 4: Contribution & Amount Selection
│   │   │   ├── success.tsx       # Screen 10: Contribution Successful confirmation
│   │   │   └── report.tsx        # Screen 9: Campaign Reports & Distribution Metrics
│   │   ├── create/
│   │   │   ├── [step].tsx        # Screen 5: 5-step wizard (basics, story, visuals, reach, submit)
│   │   │   └── preview.tsx       # Creator campaign preview screen
│   │   └── user/
│   │       ├── campaigns.tsx     # Screen 8: My Campaigns (Drafts / Active / Completed)
│   │       ├── contributions.tsx # User contributions & payment history
│   │       └── saved.tsx         # User saved/bookmarked campaigns
```

---

## 2. Screen-by-Screen Implementation Checklist & Visual Alignment

| # | Screen Name | Route | UI Reference Elements | Backend Integration |
|---|-------------|-------|------------------------|---------------------|
| 1 | **Home** | `app/(tabs)/index.tsx` | Top bar (CampaignAmp + notification bell + user avatar); Hero headline with emerald accent ("Amplify **important** messages."); "Explore Campaigns →" dark button; "Start a Campaign" ghost button; Stat highlight card ("12,5K People reached this week ↑ 28%"); "Featured Campaigns" section with "See all" and large image card. | `GET /campaigns/featured`<br>`GET /campaigns?limit=5`<br>`GET /activity/notifications/unread-count` |
| 2 | **Explore** | `app/(tabs)/explore.tsx` | Header "Explore" with subtitle; Search input with filter icon; Category pill selector ("All", "Environment", "Education", "Health", etc.); Vertical list of rounded horizontal campaign cards with square thumbnails, category badge, funding bar, and bookmark heart. | `GET /campaigns?search=&category=&sort=`<br>`POST /campaigns/:id/save`<br>`DELETE /campaigns/:id/save` |
| 3 | **Campaign Detail** | `app/campaign/[id].tsx` | Hero landscape image with floating circular back, bookmark, and share buttons; Rounded overlapping body with category pill, title, subtitle; Funding goal vs raised with emerald bar; 3-column stats row (Reach, Backers, Updates); Tab bar (About, Updates, Impact, Creator); About text with "Read more"; Fixed bottom "Contribute Now" dark button. | `GET /campaigns/:id`<br>`GET /campaigns/:id/progress`<br>`GET /campaigns/:id/feedback`<br>`POST /campaigns/:id/feedback` |
| 4 | **Contribute** | `app/campaign/contribute.tsx` | Lock icon + "Contribute" / "Secure payment via Razorpay"; Campaign mini card with thumbnail; Amplification reach estimate card (~12,500 people, info badge); Amount selection preset buttons (₹250, ₹500 selected, ₹1,000, ₹2,500, ₹5,000, Custom); Fee breakdown (95% digital ad distribution, 5% platform fee); Legal disclaimer checkbox; Fixed "Continue to Payment →" dark button. | `POST /campaigns/:id/contributions`<br>`POST /payments/razorpay/verify` |
| 5 | **Create Campaign (5 Steps)** | `app/create/[step].tsx` | Step 1–5 stepper header with emerald active circle; Step title & subtitle ("Let's start with the basics"); Campaign title input (with character counter); Category dropdown selector; Short description textarea (with character counter); Green callout tip box with lightbulb; Fixed "Save and Continue →" dark button. Steps 1-5 sequence: Basics → Story → Visuals → Reach → Submit. | `POST /campaigns` (Step 0)<br>`PUT /campaigns/:id/basics`<br>`PUT /campaigns/:id/story`<br>`PUT /campaigns/:id/visuals`<br>`PUT /campaigns/:id/reach`<br>`POST /campaigns/:id/submit` |
| 6 | **Activity** | `app/(tabs)/activity.tsx` | Header "Activity" with search icon; Filter pill tabs ("All", "Contributions", "Updates", "Saves"); Timeline feed with avatars/icons, timestamps, and notification action triggers. | `GET /activity/notifications`<br>`PATCH /activity/notifications/:id/read`<br>`POST /activity/notifications/read-all` |
| 7 | **Profile** | `app/(tabs)/profile.tsx` | Header "Profile" with settings gear; Large avatar, name, email, "Edit Profile" pill button; 3 stat counters (Campaigns, Contributions, Saved); Menu list items with icons and chevrons (My Campaigns, My Contributions, Saved Campaigns, Payment History, Demo Account Switcher, Auth0). | `GET /users/me`<br>`PATCH /users/me`<br>`GET /users/me/campaigns`<br>`GET /users/me/contributions`<br>`GET /users/me/saved-campaigns` |
| 8 | **My Campaigns** | `app/user/campaigns.tsx` | Header with back arrow; Segmented filter tabs ("Drafts", "Active", "Completed"); List of campaigns with thumbnail, title, status note ("Draft · Last edited 2 days ago"), "Continue" draft resumption button, and options menu. | `GET /users/me/campaigns` |
| 9 | **Campaign Reports** | `app/campaign/report.tsx` | Header with back arrow; Period dropdown selector ("Last 30 days"); 2x2 grid of metric cards: Total Reach (with green bar icon & ↑ 28%), Ad Impressions (eye icon & ↑ 16%), Link Clicks (cursor icon & ↑ 12%), Engagement Rate (line chart icon & ↑ 0.6%); Breakdown by platform and location. | `GET /campaigns/:id/report` |
| 10 | **Contribution Successful** | `app/campaign/success.tsx` | Large emerald checkmark circle; Headline "Contribution Successful!"; Subtitle "Thank you for helping amplify important messages."; Campaign summary card with amount & date; "View Receipt" outlined button; "Back to Campaign" dark primary button. | `GET /contributions/:id` |

---

## 3. Strict UI Design System Specifications

### Colors
- **Surface / Background**: `#FFFFFF` (Pure white for main screens), `#F9FAFB` (Subtle off-white background / card background).
- **Primary Accent (Emerald)**: `#059669` (Dark emerald), `#10B981` (Vibrant emerald accent), `#ECFDF5` (Soft mint background for badges and alert callouts).
- **Dark Primary Buttons & Text**: `#111827` (Near black for primary buttons, headers), `#374151` (Body text), `#6B7280` (Muted labels), `#9CA3AF` (Light borders & placeholders).
- **Borders & Dividers**: `#E5E7EB` (Subtle 1px borders), `#F3F4F6`.
- **Badges**:
  - Environment: BG `#ECFDF5`, Text `#065F46`
  - Education: BG `#FFF7ED`, Text `#9A3412`
  - Health: BG `#FEF2F2`, Text `#991B1B`
  - Science: BG `#EFF6FF`, Text `#1E40AF`
  - Public Policy: BG `#F5F3FF`, Text `#5B21B6`

### Typography
- Headings: 600–700 font weight with clean tracking.
- Body: 400–500 font weight with 1.4–1.5 line height.
- Labels & Badges: 500–600 weight, 12–14px size.

### Component Shapes & Elevation
- **Cards**: Border radius `16px` to `20px`, subtle 1px border `#E5E7EB`, gentle shadow.
- **Buttons**: Border radius `12px` to `14px`, 48–52px height for high touchability.
- **Pills**: Border radius `9999px` (full pill), horizontal padding `16px`, vertical `8px`.
- **Inputs**: Border radius `12px`, 48px height, 1px border `#E5E7EB`, active focus border `#10B981`.

---

## 4. End-to-End Phased Implementation Roadmap & Verification

### Phase 1 — Analyze and Plan ✅ COMPLETED
- Analyzed all 10 reference UI screens, backend endpoints, Auth0 and Razorpay contracts.
- Documented full architectural specification and screen mapping in `docs/implementation-plan.md`.

### Phase 2 — Foundation and Design System ✅ COMPLETED
- Installed `lucide-react-native`, `react-native-svg`, and `@react-native-async-storage/async-storage` using Expo SDK 58 standards.
- Built centralized theme tokens (`src/constants/theme.ts`) enforcing **light mode only**, emerald accents (`#059669` / `#10B981`), dark primary button styling (`#111827`), rounded radii, and subtle shadows.
- Configured API client (`src/api/client.ts`) with smart platform host detection and Auth0/Demo token headers.
- Built AuthContext (`src/context/auth-context.tsx`) and DraftContext (`src/context/draft-context.tsx`).
- Created reusable components: `Button`, `Badge`, `Input`, `SelectDropdown`, `TipCallout`, `ProgressBar`, `MetricCard`, `HighlightCard`, `HeaderBar`, and `ScreenContainer`.

### Phase 3 — Core Navigation & Campaign Discovery ✅ COMPLETED
- Built 5-tab layout (`src/app/(tabs)/_layout.tsx`) matching reference with custom elevated emerald "Create" center button.
- Built **Home** screen (`src/app/(tabs)/index.tsx`): Header, headline with emerald accent, "Explore Campaigns →" and "Start a Campaign" actions, 12.5K stat highlight card, and "Featured Campaigns" section with `CampaignCardLarge`.
- Built **Explore** screen (`src/app/(tabs)/explore.tsx`): Search bar with filter icon, horizontal category pills (All, Environment, Education, Health, Science, etc.), and `CampaignCardRow` items with bookmark toggle and progress bar.
- Built **Campaign Detail** screen (`src/app/campaign/[id].tsx`): Hero image with floating action bar, overlapping sheet with category badge, title, funding amounts, progress bar, 3-column stats row (reach, backers, updates), tabs (About/Updates/Impact/Creator), supporting sources, feedback voting, and fixed "Contribute Now" dark button.

### Phase 4 — 5-Step Campaign Creation Wizard ✅ COMPLETED
- Built 5-step Stepper (`src/components/creation/step-stepper.tsx`) with 1-5 connected numbered progress bar.
- Implemented wizard steps in `src/app/create/[step].tsx`:
  - **Step 1: Basics** — Title (with char count), Category dropdown, Short description (with char count), Tip callout box, "Save and Continue →".
  - **Step 2: Story** — Headline, Intro, dynamic Story content blocks, Sources with add/remove.
  - **Step 3: Visuals** — Primary ad creative, headline, call-to-action label, ad preview.
  - **Step 4: Reach** — Target location chips, audience interest chips, distribution channels, duration selection (15/30/45/60 days).
  - **Step 5: Submit** — Funding goal in rupees with live estimated reach calculation, non-donation legal disclaimer checkbox, review & submit button.
- Implemented Campaign Preview screen (`src/app/create/preview.tsx`).
- Added draft autosave and resumption via DraftContext and local storage.

### Phase 5 — Authentication, Contributions & Razorpay Payments ✅ COMPLETED
- Implemented **Contribute** screen (`src/app/campaign/contribute.tsx`):
  - Campaign mini card with thumbnail.
  - Amplification reach estimate card (~12,500 people, info tooltip).
  - Preset contribution grid (₹250, ₹500 selected, ₹1,000, ₹2,500, ₹5,000, Custom).
  - 95% ad spend / 5% verification fee breakdown.
  - Mandatory legal non-donation disclosure checkbox.
  - Backend integration: `POST /api/v1/campaigns/:id/contributions` order creation + `POST /api/v1/payments/razorpay/verify` payment verification.
- Implemented **Contribution Successful!** screen (`src/app/campaign/success.tsx`):
  - Emerald checkmark circle, "Contribution Successful!" heading, campaign mini summary card, "View Receipt" modal with full financial line items, and "Back to Campaign" primary button.

### Phase 6 — Activity, Profile, Dashboard & Distribution Reports ✅ COMPLETED
- Implemented **Activity** screen (`src/app/(tabs)/activity.tsx`): Filter tabs (All, Contributions, Updates, Saves), unread count badge, mark all read, and timeline feed matching reference.
- Implemented **Profile** screen (`src/app/(tabs)/profile.tsx`): User avatar, name, email, "Edit Profile" modal, 3 stat counters (Campaigns, Contributions, Saved), navigation menu (My Campaigns, My Contributions, Saved Campaigns, Payment History), and Demo Account Switcher (Demo Creator / Demo Backer).
- Implemented **My Campaigns** screen (`src/app/user/campaigns.tsx`): Segmented tabs (Drafts, Active, Completed), campaign cards matching reference, and "Continue" draft resumption action.
- Implemented **Campaign Reports** screen (`src/app/campaign/report.tsx`): "Last 30 days" period dropdown, 2x2 metric cards (Total Reach 12,500 ↑28%, Ad Impressions 48,200 ↑16%, Link Clicks 2,340 ↑12%, Engagement Rate 4.8% ↑0.6%), channel allocation progress bars, and financial breakdown.
- Implemented **My Contributions** screen (`src/app/user/contributions.tsx`) and **Saved Campaigns** screen (`src/app/user/saved.tsx`).

### Phase 7 — Integration & Quality Assurance ✅ PASSED
- **TypeScript Verification**: Passed (`npx tsc --noEmit` exited with 0 errors).
- **Metro Bundler & Export Verification**: `npx expo export` bundled successfully:
  - iOS bundle: `5 MB`
  - Android bundle: `5.4 MB`
  - Web static routes: all 10 screens compiled without errors.
- **Backend API Integration**: Backend verified running on `http://localhost:5000` with live database connection and demo/Auth0 authentication support.

---

## 5. How to Run the Application

### 1. Run the Backend API
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000 (Health check: http://localhost:5000/health)
```

### 2. Run the Mobile App
```bash
cd mobile
npx expo start
```
- Press `w` to open in Web Browser.
- Press `a` to open in Android Emulator / connected device.
- Press `i` to open in iOS Simulator.
