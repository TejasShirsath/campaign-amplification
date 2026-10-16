-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'FUNDING', 'FUNDED', 'DISTRIBUTION_PREP', 'PROMOTING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignCategory" AS ENUM ('ENVIRONMENT', 'HEALTH', 'SCIENCE', 'EDUCATION', 'PUBLIC_POLICY', 'ECONOMIC_POLICY', 'COMMUNITY', 'ARTS_CULTURE', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CAMPAIGN_SUBMITTED', 'CAMPAIGN_APPROVED', 'CAMPAIGN_REJECTED', 'CAMPAIGN_CHANGES_REQUESTED', 'CAMPAIGN_FUNDING_AVAILABLE', 'FUNDING_MILESTONE', 'CAMPAIGN_DEADLINE_APPROACHING', 'CONTRIBUTION_SUCCESSFUL', 'CONTRIBUTION_FAILED', 'CAMPAIGN_PROMOTION_STARTED', 'DISTRIBUTION_PROGRESS', 'CAMPAIGN_COMPLETED', 'REPORT_AVAILABLE', 'CAMPAIGN_UPDATE', 'ACCOUNT_SECURITY');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('VISUAL_ENGAGEMENT', 'MESSAGE_IMPACT');

-- CreateEnum
CREATE TYPE "FeedbackValue" AS ENUM ('NO', 'SOMEWHAT', 'YES');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_subject" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "category" "CampaignCategory",
    "creator_name" TEXT,
    "summary" TEXT,
    "cover_image_url" TEXT,
    "headline" TEXT,
    "intro_text" TEXT,
    "story_content" JSONB,
    "sources" JSONB,
    "suggested_actions" TEXT,
    "target_locations" JSONB,
    "audience_interests" JSONB,
    "distribution_channels" JSONB,
    "campaign_duration" INTEGER,
    "funding_goal_paise" INTEGER,
    "estimated_reach" INTEGER,
    "agreed_to_terms" BOOLEAN NOT NULL DEFAULT false,
    "total_raised_paise" INTEGER NOT NULL DEFAULT 0,
    "contributor_count" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "funding_ends_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "completed_steps" JSONB,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_creatives" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "call_to_action" TEXT,
    "caption" TEXT,
    "credit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_targeting" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "locations" JSONB,
    "age_range" JSONB,
    "interests" JSONB,
    "gender" TEXT,
    "platforms" JSONB,
    "budget_split" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_targeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "platform_fee_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "contribution_id" UUID NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "error_message" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_campaigns" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_events" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_feedback" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "value" "FeedbackValue" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_reports" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "total_raised_paise" INTEGER NOT NULL,
    "ad_spend_paise" INTEGER NOT NULL,
    "platform_fee_paise" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "estimated_reach" INTEGER NOT NULL,
    "measured_reach" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_subject_key" ON "users"("auth_subject");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_category_idx" ON "campaigns"("category");

-- CreateIndex
CREATE INDEX "campaigns_creator_id_idx" ON "campaigns"("creator_id");

-- CreateIndex
CREATE INDEX "campaigns_is_featured_idx" ON "campaigns"("is_featured");

-- CreateIndex
CREATE INDEX "campaigns_created_at_idx" ON "campaigns"("created_at");

-- CreateIndex
CREATE INDEX "campaigns_total_raised_paise_idx" ON "campaigns"("total_raised_paise");

-- CreateIndex
CREATE INDEX "campaign_creatives_campaign_id_idx" ON "campaign_creatives"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_targeting_campaign_id_key" ON "campaign_targeting"("campaign_id");

-- CreateIndex
CREATE INDEX "contributions_campaign_id_idx" ON "contributions"("campaign_id");

-- CreateIndex
CREATE INDEX "contributions_user_id_idx" ON "contributions"("user_id");

-- CreateIndex
CREATE INDEX "contributions_status_idx" ON "contributions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_razorpay_order_id_key" ON "payment_attempts"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_razorpay_payment_id_key" ON "payment_attempts"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payment_attempts_contribution_id_idx" ON "payment_attempts"("contribution_id");

-- CreateIndex
CREATE INDEX "payment_attempts_razorpay_order_id_idx" ON "payment_attempts"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "payment_attempts_razorpay_payment_id_idx" ON "payment_attempts"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "saved_campaigns_user_id_idx" ON "saved_campaigns"("user_id");

-- CreateIndex
CREATE INDEX "saved_campaigns_campaign_id_idx" ON "saved_campaigns"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_campaigns_user_id_campaign_id_key" ON "saved_campaigns"("user_id", "campaign_id");

-- CreateIndex
CREATE INDEX "campaign_events_campaign_id_idx" ON "campaign_events"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_events_user_id_idx" ON "campaign_events"("user_id");

-- CreateIndex
CREATE INDEX "campaign_events_created_at_idx" ON "campaign_events"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "campaign_feedback_campaign_id_idx" ON "campaign_feedback"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_feedback_campaign_id_user_id_type_key" ON "campaign_feedback"("campaign_id", "user_id", "type");

-- CreateIndex
CREATE INDEX "distribution_reports_campaign_id_idx" ON "distribution_reports"("campaign_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creatives" ADD CONSTRAINT "campaign_creatives_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_targeting" ADD CONSTRAINT "campaign_targeting_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_campaigns" ADD CONSTRAINT "saved_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_campaigns" ADD CONSTRAINT "saved_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_feedback" ADD CONSTRAINT "campaign_feedback_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_feedback" ADD CONSTRAINT "campaign_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_reports" ADD CONSTRAINT "distribution_reports_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
