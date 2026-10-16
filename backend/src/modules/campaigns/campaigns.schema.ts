import { z } from 'zod';

// ─── Campaign Categories ────────────────────────────────────────────────────────

export const campaignCategories = [
  'ENVIRONMENT',
  'HEALTH',
  'SCIENCE',
  'EDUCATION',
  'PUBLIC_POLICY',
  'ECONOMIC_POLICY',
  'COMMUNITY',
  'ARTS_CULTURE',
  'BUSINESS',
  'OTHER',
] as const;

// ─── Step 1: Basics ─────────────────────────────────────────────────────────────

export const campaignBasicsSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(60, 'Title must be 60 characters or fewer'),
  category: z.enum(campaignCategories, {
    message: 'Please select a valid category',
  }),
  creatorName: z
    .string()
    .min(1, 'Creator or organization name is required')
    .max(100),
  summary: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});

// ─── Step 2: Story ──────────────────────────────────────────────────────────────

const storySectionSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'statistic', 'heading']),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  value: z.string().optional(),
  label: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const campaignStorySchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  introText: z.string().max(2000).optional().nullable(),
  storyContent: z.array(storySectionSchema).optional().nullable(),
  sources: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        url: z.string().url(),
      })
    )
    .optional()
    .nullable(),
  suggestedActions: z.string().max(1000).optional().nullable(),
});

// ─── Step 3: Visuals ────────────────────────────────────────────────────────────

const creativeSchema = z.object({
  type: z.enum(['cover', 'ad_image', 'video']),
  url: z.string().url(),
  headline: z.string().max(90).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  callToAction: z.string().max(30).optional().nullable(),
  caption: z.string().max(200).optional().nullable(),
  credit: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const campaignVisualsSchema = z.object({
  creatives: z.array(creativeSchema).optional().default([]),
});

// ─── Step 4: Reach ──────────────────────────────────────────────────────────────

export const campaignReachSchema = z.object({
  targetLocations: z.array(z.string()).optional().nullable(),
  audienceInterests: z.array(z.string()).optional().nullable(),
  distributionChannels: z.array(z.string()).optional().nullable(),
  campaignDuration: z.number().int().min(1).max(365).optional().nullable(),
});

// ─── Step 5: Submit ─────────────────────────────────────────────────────────────

export const campaignSubmitSchema = z.object({
  fundingGoalPaise: z
    .number()
    .int()
    .min(10000, 'Minimum funding goal is ₹100 (10000 paise)')
    .max(100000000, 'Maximum funding goal is ₹10,00,000'),
  estimatedReach: z.number().int().min(0).optional().nullable(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the campaign terms',
  }),
});

// ─── Full campaign update (partial, any step) ────────────────────────────────────

export const updateCampaignSchema = z.object({
  // Basics
  title: z.string().min(1).max(60).optional(),
  category: z.enum(campaignCategories).optional(),
  creatorName: z.string().min(1).max(100).optional(),
  summary: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),

  // Story
  headline: z.string().max(200).optional().nullable(),
  introText: z.string().max(2000).optional().nullable(),
  storyContent: z.any().optional().nullable(),
  sources: z.any().optional().nullable(),
  suggestedActions: z.string().max(1000).optional().nullable(),

  // Reach
  targetLocations: z.array(z.string()).optional().nullable(),
  audienceInterests: z.array(z.string()).optional().nullable(),
  distributionChannels: z.array(z.string()).optional().nullable(),
  campaignDuration: z.number().int().min(1).max(365).optional().nullable(),

  // Submit
  fundingGoalPaise: z.number().int().min(10000).max(100000000).optional(),
  estimatedReach: z.number().int().min(0).optional().nullable(),
  agreedToTerms: z.boolean().optional(),

  // Step tracking
  completedSteps: z.array(z.string()).optional(),
});

// ─── Discovery / query schemas ───────────────────────────────────────────────────

export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(campaignCategories).optional(),
  status: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['newest', 'oldest', 'most_funded', 'least_funded', 'ending_soon']).optional().default('newest'),
  featured: z.coerce.boolean().optional(),
});

export type CampaignBasicsInput = z.infer<typeof campaignBasicsSchema>;
export type CampaignStoryInput = z.infer<typeof campaignStorySchema>;
export type CampaignVisualsInput = z.infer<typeof campaignVisualsSchema>;
export type CampaignReachInput = z.infer<typeof campaignReachSchema>;
export type CampaignSubmitInput = z.infer<typeof campaignSubmitSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>;
