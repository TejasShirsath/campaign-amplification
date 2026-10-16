# Campaign Amplification Platform — API Documentation & Postman Guide

This document provides a guide for manually testing and integrating the Campaign Amplification Platform REST API.

---

## ⚡ Quick Start with Postman

A pre-configured Postman Collection is available at:
📁 **[`backend/postman_collection.json`](file:///c:/Users/tejas/GitHub/campaign-amplification/backend/postman_collection.json)**

### How to Import into Postman
1. Open **Postman**.
2. Click the **Import** button in the top-left corner.
3. Select the file `backend/postman_collection.json` (or drag and drop it).
4. The collection **Campaign Amplification Platform API** will appear in your left sidebar with 7 organized folders.

### Configuring Collection Variables
The collection uses environment variables. To view or change them:
1. Click on the collection name in Postman: **Campaign Amplification Platform API**.
2. Go to the **Variables** tab.
3. You will see:
   - `baseUrl`: Defaults to `http://localhost:5000`
   - `token`: Your Auth0 JWT Access Token (for protected endpoints)
   - `campaignId`: UUID of a campaign (auto-filled or copied from a listing)
   - `contributionId`: UUID of a contribution
   - `notificationId`: UUID of a notification

---

## 🌐 Testing Steps: Walkthrough

### Stage 1: Public Discovery (No Login Required)

You can test these endpoints immediately without setting up any Auth0 token:

#### 1. Liveness & Database Readiness
- `GET http://localhost:5000/health`
  - Response: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "campaign-amplification-api",
      "timestamp": "2026-10-16T18:25:00.000Z",
      "uptime": 142.5
    }
  }
  ```
- `GET http://localhost:5000/ready`
  - Response: `200 OK` (checks database connection)

#### 2. Browse Campaigns Feed
- `GET http://localhost:5000/api/v1/campaigns?page=1&limit=10&category=HEALTH&sort=newest`
  - **Query Parameters**:
    - `page` (number, default: 1)
    - `limit` (number, default: 20, max: 50)
    - `category` (enum: `ENVIRONMENT`, `HEALTH`, `SCIENCE`, `EDUCATION`, `PUBLIC_POLICY`, `ECONOMIC_POLICY`, `COMMUNITY`, `ARTS_CULTURE`, `BUSINESS`, `OTHER`)
    - `sort` (enum: `newest`, `oldest`, `most_funded`, `least_funded`, `ending_soon`)
    - `search` (string, searches title and summary)
    - `featured` (boolean, filter by featured status)
  - **Response**: Paginated campaign array. Copy one `id` to the `{{campaignId}}` variable in Postman.

#### 3. Inspect Campaign Details & Progress
- `GET http://localhost:5000/api/v1/campaigns/:id`
  - Returns full campaign details, story blocks, supporting sources, creatives, and creator profile.
- `GET http://localhost:5000/api/v1/campaigns/:id/progress`
  - Returns funding stats: `fundingGoalPaise`, `totalRaisedPaise`, `percentFunded`, `contributorCount`, `daysRemaining`.
- `GET http://localhost:5000/api/v1/campaigns/:id/feedback`
  - Returns community feedback vote totals (`VISUAL_ENGAGEMENT` and `MESSAGE_IMPACT`).
- `GET http://localhost:5000/api/v1/activity/campaigns/:id/events`
  - Public activity timeline feed for the campaign.

---

### Stage 2: Authenticated Flow (Auth0 Token Required)

For protected endpoints, include the header:
```text
Authorization: Bearer <AUTH0_ACCESS_TOKEN>
```

#### 4. User Profile
- `GET http://localhost:5000/api/v1/users/me`
  - Automatically provisions or synchronizes the local database user based on the Auth0 subject (`sub`).
- `PATCH http://localhost:5000/api/v1/users/me`
  ```json
  {
    "displayName": "Tejas S.",
    "bio": "Backer & Community Organizer",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
  ```

---

### Stage 3: 5-Step Campaign Creation

Follow these steps in sequence to create and submit a campaign:

#### Step 0: Initialize Draft
- **Endpoint**: `POST http://localhost:5000/api/v1/campaigns`
- **Request Body**:
  ```json
  {
    "title": "Clean Water Filters for 50 Rural Schools",
    "category": "HEALTH",
    "creatorName": "Jal Jeevan Trust",
    "summary": "Funding targeted digital outreach to bring water purification systems to remote schools.",
    "coverImageUrl": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800"
  }
  ```
- **Response**: `201 Created` with campaign object. Copy `data.id` to `{{campaignId}}`.

#### Step 1: Basics
- **Endpoint**: `PUT http://localhost:5000/api/v1/campaigns/:id/basics`
- **Request Body**:
  ```json
  {
    "title": "Clean Water Filters for 50 Rural Schools",
    "category": "HEALTH",
    "creatorName": "Jal Jeevan Trust",
    "summary": "Funding targeted digital outreach to bring water purification systems to remote schools.",
    "coverImageUrl": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800"
  }
  ```

#### Step 2: Story & Sources
- **Endpoint**: `PUT http://localhost:5000/api/v1/campaigns/:id/story`
- **Request Body**:
  ```json
  {
    "headline": "Children in rural schools walk 3km for drinking water",
    "introText": "Over 50 schools currently lack working water filters, impacting over 8,000 students.",
    "storyContent": [
      {
        "id": "section-1",
        "type": "text",
        "content": "Waterborne illnesses cause high absenteeism. Gravity micro-filters provide safe water without electricity."
      },
      {
        "id": "section-2",
        "type": "statistic",
        "value": "78%",
        "caption": "Reduction in gastrointestinal illnesses following filter installation"
      }
    ],
    "sources": [
      {
        "title": "District Health Department Audit 2025",
        "url": "https://example.gov.in/health/water-audit"
      }
    ],
    "suggestedActions": "Back this distribution fund to run local ads targeting corporate CSR donors."
  }
  ```

#### Step 3: Visuals & Ad Creatives
- **Endpoint**: `PUT http://localhost:5000/api/v1/campaigns/:id/visuals`
- **Request Body**:
  ```json
  {
    "creatives": [
      {
        "type": "cover",
        "url": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800",
        "headline": "Pure Water for Every Student",
        "description": "Amplify this message across Maharashtra",
        "callToAction": "Support Distribution",
        "sortOrder": 0
      },
      {
        "type": "ad_image",
        "url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
        "headline": "Give 8,000 Kids Safe Water",
        "caption": "Water filter installed in district school",
        "sortOrder": 1
      }
    ]
  }
  ```

#### Step 4: Reach & Distribution Channels
- **Endpoint**: `PUT http://localhost:5000/api/v1/campaigns/:id/reach`
- **Request Body**:
  ```json
  {
    "targetLocations": ["Mumbai", "Pune", "Nashik", "Nagpur"],
    "audienceInterests": ["Child Welfare", "Education", "Clean Water"],
    "distributionChannels": ["Instagram", "YouTube", "Local Transit Screens"],
    "campaignDuration": 30
  }
  ```

#### Step 5: Submit Campaign for Review
- **Endpoint**: `POST http://localhost:5000/api/v1/campaigns/:id/submit`
- **Request Body**:
  ```json
  {
    "fundingGoalPaise": 5000000,
    "estimatedReach": 65000,
    "agreedToTerms": true
  }
  ```
- **Rules Enforced**:
  - `fundingGoalPaise`: Minimum ₹100 (`10000` paise), Maximum ₹10,00,000 (`100000000` paise).
  - `agreedToTerms`: Must be `true`.
  - Required fields from Steps 1–4 must be filled.
  - Status transitions to `SUBMITTED`.

---

### Stage 4: Contributions & Payments

#### 1. Create a Contribution
- **Endpoint**: `POST http://localhost:5000/api/v1/campaigns/:id/contributions`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "amountPaise": 50000,
    "isAnonymous": true
  }
  ```
  *(50000 paise = ₹500)*
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "contributionId": "123e4567-e89b-12d3-a456-426614174001",
      "orderId": "order_demo_12345678",
      "amountPaise": 50000,
      "platformFeePaise": 2500,
      "totalPaise": 52500,
      "currency": "INR",
      "keyId": "rzp_test_YOUR_KEY",
      "campaignTitle": "Clean Water Filters for 50 Rural Schools",
      "isDemoMode": true
    }
  }
  ```

#### 2. Verify Payment
- **Endpoint**: `POST http://localhost:5000/api/v1/payments/razorpay/verify`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "razorpayOrderId": "order_demo_12345678",
    "razorpayPaymentId": "pay_demo_87654321",
    "razorpaySignature": "simulated_or_real_signature"
  }
  ```
- **Response**: `200 OK`
  - In `DEMO_PAYMENT_MODE=true`, instantly confirms contribution, updates campaign total raised and contributor count atomically, and issues a backer milestone notification.

---

### Stage 5: Bookmarks, Feedback & Notifications

#### 1. Bookmarks / Saved Campaigns
- **Save**: `POST /api/v1/campaigns/:id/save` (Idempotent upsert)
- **Unsave**: `DELETE /api/v1/campaigns/:id/save`
- **Check Status**: `GET /api/v1/campaigns/:id/saved` → `{ "success": true, "data": { "isSaved": true } }`

#### 2. Community Feedback
- **Submit Feedback Vote**: `POST /api/v1/campaigns/:id/feedback`
  ```json
  {
    "type": "VISUAL_ENGAGEMENT",
    "value": "YES"
  }
  ```
  - `type`: `VISUAL_ENGAGEMENT` or `MESSAGE_IMPACT`
  - `value`: `YES`, `SOMEWHAT`, or `NO`
  - Allows changing vote (upsert).

#### 3. Notifications Feed
- `GET /api/v1/activity/notifications`
- `GET /api/v1/activity/notifications/unread-count` → `{ "unreadCount": 3 }`
- `PATCH /api/v1/activity/notifications/:id/read`
- `POST /api/v1/activity/notifications/read-all`

---

## 🛠️ Error Codes Reference

All error responses return HTTP status >= 400 with a standard JSON structure:
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Campaign title is required before submission",
    "details": []
  }
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `BAD_REQUEST` | Validation error, malformed JSON, or missing required field |
| `401` | `UNAUTHORIZED` | Missing, invalid, or expired Auth0 JWT Bearer token |
| `403` | `FORBIDDEN` | Modifying a campaign owned by another user |
| `404` | `NOT_FOUND` | Resource (campaign, contribution, report) not found |
| `409` | `CONFLICT` | Invalid lifecycle transition (e.g. submitting a completed campaign) |
| `429` | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| `500` | `INTERNAL_ERROR` | Unexpected server error (secrets and stack traces hidden) |
| `503` | `SERVICE_UNAVAILABLE` | Database readiness check failed |
