import { z } from 'zod';

export const createContributionSchema = z.object({
  amountPaise: z
    .number()
    .int()
    .min(100, 'Minimum contribution is $1')
    .max(10000000, 'Maximum contribution is $100,000'),
  isAnonymous: z.boolean().optional().default(true),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().optional().default(''),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
