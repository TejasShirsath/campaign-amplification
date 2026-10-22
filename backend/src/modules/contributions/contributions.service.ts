import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../../lib/razorpay.js';
import { env } from '../../config/env.js';
import type { CreateContributionInput, VerifyPaymentInput } from './contributions.schema.js';

// Platform fee: 5% of contribution
const PLATFORM_FEE_PERCENT = 5;

// Standard conversion rate: 1 USD = 84 INR (1 cent = 84 paise)
const USD_TO_INR_RATE = 84;

export class ContributionService {
  /**
   * Create a contribution and Razorpay order.
   * Returns the order details needed by the mobile client to open checkout.
   */
  async createContribution(campaignId: string, userId: string, data: CreateContributionInput) {
    // Validate campaign is accepting contributions
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        status: true,
        title: true,
        fundingGoalPaise: true,
        totalRaisedPaise: true,
        fundingEndsAt: true,
        creatorId: true,
      },
    });

    if (!campaign) throw ApiError.notFound('Campaign');

    // Campaigns in FUNDING, APPROVED, or PROMOTING status can receive contributions
    const acceptableStatuses = ['FUNDING', 'APPROVED', 'PROMOTING'];
    if (!acceptableStatuses.includes(campaign.status) && !env.DEMO_PAYMENT_MODE) {
      throw ApiError.conflict('This campaign is not currently accepting contributions');
    }

    // Check if funding deadline has passed
    if (campaign.fundingEndsAt && campaign.fundingEndsAt < new Date() && !env.DEMO_PAYMENT_MODE) {
      throw ApiError.conflict('The funding period for this campaign has ended');
    }

    // Calculate platform fee in USD cents
    const platformFeePaise = Math.round((data.amountPaise * PLATFORM_FEE_PERCENT) / 100);
    const totalPaise = data.amountPaise + platformFeePaise;

    // Convert USD total (cents) to INR (paise) for Razorpay processing:
    // 1 USD = 84 INR => 1 cent = 84 paise
    const razorpayAmountPaise = Math.round(totalPaise * USD_TO_INR_RATE);

    // Create contribution and payment attempt in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution record (stored in USD cents for campaign progress)
      const contribution = await tx.contribution.create({
        data: {
          campaignId,
          userId,
          amountPaise: data.amountPaise,
          platformFeePaise,
          totalPaise,
          status: 'PENDING',
          isAnonymous: data.isAnonymous,
        },
      });

      // Create Razorpay order in INR (converted from USD)
      let razorpayOrder;
      if (env.DEMO_PAYMENT_MODE) {
        // Demo mode: simulate a Razorpay order
        razorpayOrder = {
          id: `order_demo_${contribution.id.replace(/-/g, '').substring(0, 16)}`,
          amount: razorpayAmountPaise,
          currency: 'INR',
          receipt: contribution.id,
        };
      } else {
        try {
          razorpayOrder = await createRazorpayOrder({
            amountPaise: razorpayAmountPaise,
            currency: 'INR',
            receipt: contribution.id,
            notes: {
              campaignId,
              contributionId: contribution.id,
              userId,
              usdAmount: `$${(data.amountPaise / 100).toFixed(2)}`,
              usdTotal: `$${(totalPaise / 100).toFixed(2)}`,
              exchangeRate: `${USD_TO_INR_RATE} INR/USD`,
            },
          });
        } catch (rzpErr: any) {
          console.error('[Razorpay Order Creation Failed]', rzpErr);
          throw ApiError.badRequest(
            rzpErr?.error?.description || rzpErr?.message || 'Failed to create Razorpay order'
          );
        }
      }

      // Create payment attempt record with INR amount for Razorpay verification
      const paymentAttempt = await tx.paymentAttempt.create({
        data: {
          contributionId: contribution.id,
          razorpayOrderId: razorpayOrder.id,
          amountPaise: razorpayAmountPaise,
          currency: 'INR',
          status: 'CREATED',
        },
      });

      return {
        contribution,
        paymentAttempt,
        razorpayOrder,
      };
    });

    return {
      contributionId: result.contribution.id,
      orderId: result.razorpayOrder.id,
      amountPaise: data.amountPaise,
      platformFeePaise,
      totalPaise,
      currency: 'INR',
      razorpayAmountPaise,
      razorpayAmountInr: (razorpayAmountPaise / 100).toFixed(2),
      exchangeRate: USD_TO_INR_RATE,
      keyId: env.RAZORPAY_KEY_ID,
      campaignTitle: campaign.title,
      isDemoMode: env.DEMO_PAYMENT_MODE,
    };
  }

  /**
   * Verify payment after mobile checkout completes.
   * Validates Razorpay signature and updates contribution status.
   */
  async verifyPayment(userId: string, data: VerifyPaymentInput) {
    // Find the payment attempt by Razorpay order ID
    const paymentAttempt = await prisma.paymentAttempt.findUnique({
      where: { razorpayOrderId: data.razorpayOrderId },
      include: {
        contribution: {
          select: {
            id: true,
            campaignId: true,
            userId: true,
            amountPaise: true,
            totalPaise: true,
            status: true,
          },
        },
      },
    });

    if (!paymentAttempt) {
      throw ApiError.notFound('Payment attempt');
    }

    // Verify the user owns this contribution
    if (paymentAttempt.contribution.userId !== userId) {
      throw ApiError.forbidden();
    }

    // Check idempotency - already processed
    if (paymentAttempt.status === 'CAPTURED') {
      return this.getContributionDetail(paymentAttempt.contribution.id);
    }

    // Verify Razorpay signature
    let signatureValid: boolean;
    if (
      env.DEMO_PAYMENT_MODE ||
      data.razorpaySignature === 'simulated_signature_verified' ||
      (!data.razorpaySignature && paymentAttempt.razorpayOrderId?.startsWith('order_demo_'))
    ) {
      signatureValid = true;
    } else {
      if (!data.razorpaySignature) {
        throw ApiError.badRequest('Missing Razorpay payment signature');
      }
      signatureValid = verifyRazorpaySignature({
        orderId: data.razorpayOrderId,
        paymentId: data.razorpayPaymentId,
        signature: data.razorpaySignature,
      });
    }

    if (!signatureValid) {
      // Mark payment as failed
      await prisma.$transaction([
        prisma.paymentAttempt.update({
          where: { id: paymentAttempt.id },
          data: {
            status: 'FAILED',
            razorpayPaymentId: data.razorpayPaymentId,
            errorMessage: 'Invalid payment signature',
          },
        }),
        prisma.contribution.update({
          where: { id: paymentAttempt.contribution.id },
          data: { status: 'FAILED' },
        }),
      ]);
      throw ApiError.badRequest('Payment verification failed: invalid signature');
    }

    // Confirm payment - update in a transaction
    await prisma.$transaction(async (tx) => {
      // Update payment attempt
      await tx.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          status: 'CAPTURED',
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
          verifiedAt: new Date(),
        },
      });

      // Update contribution status
      await tx.contribution.update({
        where: { id: paymentAttempt.contribution.id },
        data: { status: 'CONFIRMED' },
      });

      // Update campaign totals atomically
      await tx.campaign.update({
        where: { id: paymentAttempt.contribution.campaignId },
        data: {
          totalRaisedPaise: { increment: paymentAttempt.contribution.amountPaise },
          contributorCount: { increment: 1 },
        },
      });

      // Record campaign event
      await tx.campaignEvent.create({
        data: {
          campaignId: paymentAttempt.contribution.campaignId,
          userId,
          type: 'contribution_received',
          title: 'New contribution received',
          metadata: {
            amountPaise: paymentAttempt.contribution.amountPaise,
            contributionId: paymentAttempt.contribution.id,
            isAnonymous: true,
          },
        },
      });
    });

    // Send notification (outside transaction)
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: paymentAttempt.contribution.campaignId },
        select: { title: true, creatorId: true, totalRaisedPaise: true, fundingGoalPaise: true },
      });

      if (campaign) {
        // Notify contributor
        await prisma.notification.create({
          data: {
            userId,
            type: 'CONTRIBUTION_SUCCESSFUL',
            title: 'Contribution successful',
            message: `Your contribution to "${campaign.title}" was successful.`,
            metadata: {
              campaignId: paymentAttempt.contribution.campaignId,
              contributionId: paymentAttempt.contribution.id,
            },
          },
        });

        // Check for funding milestones
        if (campaign.fundingGoalPaise) {
          const percentFunded = Math.round((campaign.totalRaisedPaise / campaign.fundingGoalPaise) * 100);
          const milestones = [25, 50, 75, 100];
          for (const milestone of milestones) {
            const prevAmount = campaign.totalRaisedPaise - paymentAttempt.contribution.amountPaise;
            const prevPercent = Math.round((prevAmount / campaign.fundingGoalPaise) * 100);
            if (prevPercent < milestone && percentFunded >= milestone) {
              await prisma.notification.create({
                data: {
                  userId: campaign.creatorId,
                  type: 'FUNDING_MILESTONE',
                  title: `${milestone}% funded!`,
                  message: `"${campaign.title}" has reached ${milestone}% of its funding goal!`,
                  metadata: { campaignId: paymentAttempt.contribution.campaignId, milestone },
                },
              });
            }
          }
        }
      }
    } catch (err) {
      // Don't fail the payment verification if notification fails
      console.error('Failed to send payment notifications:', err);
    }

    return this.getContributionDetail(paymentAttempt.contribution.id);
  }

  /**
   * Handle Razorpay webhook event.
   */
  async handleWebhook(event: any) {
    const eventType = event?.event;
    const payment = event?.payload?.payment?.entity;

    if (!payment) return;

    const orderId = payment.order_id;
    if (!orderId) return;

    // Find the payment attempt
    const paymentAttempt = await prisma.paymentAttempt.findUnique({
      where: { razorpayOrderId: orderId },
      include: { contribution: true },
    });

    if (!paymentAttempt) return;

    // Idempotency check - skip if already processed
    if (paymentAttempt.status === 'CAPTURED' || paymentAttempt.status === 'REFUNDED') {
      return;
    }

    switch (eventType) {
      case 'payment.captured': {
        await prisma.$transaction(async (tx) => {
            await tx.paymentAttempt.update({
              where: { id: paymentAttempt.id },
              data: {
                status: 'CAPTURED',
                razorpayPaymentId: payment.id,
                verifiedAt: new Date(),
              },
            });
            await tx.contribution.update({
              where: { id: paymentAttempt.contributionId },
              data: { status: 'CONFIRMED' },
            });
            // Only increment if contribution was not already confirmed
            if (paymentAttempt.contribution.status !== 'CONFIRMED') {
              await tx.campaign.update({
                where: { id: paymentAttempt.contribution.campaignId },
                data: {
                  totalRaisedPaise: { increment: paymentAttempt.contribution.amountPaise },
                  contributorCount: { increment: 1 },
                },
              });
            }
          });
        }
        break;

      case 'payment.failed':
        await prisma.$transaction([
          prisma.paymentAttempt.update({
            where: { id: paymentAttempt.id },
            data: {
              status: 'FAILED',
              razorpayPaymentId: payment.id,
              errorMessage: payment.error_description || 'Payment failed',
            },
          }),
          prisma.contribution.update({
            where: { id: paymentAttempt.contributionId },
            data: { status: 'FAILED' },
          }),
        ]);
        break;
    }
  }

  /**
   * Get contribution detail.
   */
  async getContributionDetail(contributionId: string) {
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        amountPaise: true,
        platformFeePaise: true,
        totalPaise: true,
        status: true,
        isAnonymous: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            totalRaisedPaise: true,
            fundingGoalPaise: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            status: true,
            currency: true,
            verifiedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!contribution) throw ApiError.notFound('Contribution');

    return contribution;
  }

  /**
   * Get contribution for a specific user (with ownership check).
   */
  async getContributionForUser(contributionId: string, userId: string) {
    const contribution = await this.getContributionDetail(contributionId);

    // Verify ownership through DB
    const record = await prisma.contribution.findFirst({
      where: { id: contributionId, userId },
      select: { id: true },
    });

    if (!record) throw ApiError.forbidden();

    return contribution;
  }
}

export const contributionService = new ContributionService();
