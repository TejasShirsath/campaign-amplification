import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate, optionalAuth, resolveDemoUser } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { createContributionSchema, verifyPaymentSchema } from './contributions.schema.js';
import { contributionService } from './contributions.service.js';
import { userService } from '../users/users.service.js';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { verifyWebhookSignature } from '../../lib/razorpay.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';

const router = Router();

// POST /campaigns/:id/contributions - Create a contribution (requires authentication)
router.post(
  '/campaigns/:id/contributions',
  ...authenticate,
  validate({ params: uuidParamSchema, body: createContributionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const result = await contributionService.createContribution(
      req.params.id as string,
      userId,
      req.body
    );
    sendCreated(res, result);
  })
);

// GET /contributions/:id - Get contribution detail (supports authenticated and guest contributors)
router.get(
  '/contributions/:id',
  optionalAuth,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const contribution = await contributionService.getContributionDetail(
      req.params.id as string
    );
    sendSuccess(res, contribution);
  })
);

// GET /payments/razorpay/checkout/:orderId - Hosted Razorpay Checkout page for mobile webviews / web-browsers
router.get(
  '/payments/razorpay/checkout/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;
    let attempt = await prisma.paymentAttempt.findUnique({
      where: { razorpayOrderId: orderId },
      include: {
        contribution: {
          include: {
            campaign: { select: { title: true } },
            user: { select: { displayName: true, name: true, email: true } },
          },
        },
      },
    });

    if (!attempt) {
      attempt = await prisma.paymentAttempt.findFirst({
        where: { contributionId: orderId },
        include: {
          contribution: {
            include: {
              campaign: { select: { title: true } },
              user: { select: { displayName: true, name: true, email: true } },
            },
          },
        },
      });
    }

    if (!attempt) {
      throw ApiError.notFound('Payment order');
    }

    // Explicitly configure headers so Razorpay Checkout JS and iframe load without CSP restrictions
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; connect-src * https://api.razorpay.com https://lumberjack.razorpay.com; frame-src * https://api.razorpay.com; style-src * 'unsafe-inline' https:; img-src * data: https:;"
    );

    const campaignTitle = attempt.contribution.campaign.title;
    const customerName = attempt.contribution.user?.displayName || attempt.contribution.user?.name || '';
    const customerEmail = attempt.contribution.user?.email || '';
    const isRealRazorpayOrder = Boolean(attempt.razorpayOrderId && !attempt.razorpayOrderId.startsWith('order_demo_'));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RippleUp - Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b; padding: 20px; }
    .card { background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); padding: 32px 24px; max-width: 400px; width: 100%; text-align: center; border: 1px solid #e2e8f0; }
    .brand { font-size: 24px; font-weight: 800; color: #249770; margin-bottom: 8px; }
    .tagline { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .spinner { border: 4px solid #f1f5f9; border-top: 4px solid #249770; border-radius: 50%; width: 44px; height: 44px; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    .btn { background: #249770; color: white; border: none; padding: 14px 20px; border-radius: 12px; font-size: 16px; font-weight: 700; width: 100%; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #1e7d5d; }
    .btn-cancel { background: transparent; color: #94a3b8; border: none; padding: 10px; margin-top: 12px; font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">RippleUp</div>
    <div class="tagline">Campaign Amplification Platform</div>
    <div id="loader" class="spinner"></div>
    <div class="title">Secure Razorpay Payment</div>
    <div class="desc">${campaignTitle} (₹${(attempt.amountPaise / 100).toFixed(2)})</div>
    <button id="payBtn" class="btn" onclick="openCheckout()">Proceed with Payment</button>
    <button class="btn-cancel" onclick="cancelPayment()">Cancel</button>
  </div>

  <script>
    var isRealOrder = ${JSON.stringify(isRealRazorpayOrder)};
    var options = {
      key: "${env.RAZORPAY_KEY_ID}",
      amount: ${attempt.amountPaise},
      currency: "${attempt.currency || 'INR'}",
      name: "RippleUp",
      description: "Contribution to " + ${JSON.stringify(campaignTitle)},
      prefill: {
        name: ${JSON.stringify(customerName)},
        email: ${JSON.stringify(customerEmail)}
      },
      theme: {
        color: "#249770"
      },
      modal: {
        ondismiss: function() {
          cancelPayment();
        }
      },
      handler: async function(response) {
        document.getElementById('loader').style.display = 'block';
        document.getElementById('payBtn').style.display = 'none';
        document.querySelector('.title').innerText = 'Payment Successful!';
        document.querySelector('.desc').innerText = 'Verifying contribution and returning to app...';

        try {
          await fetch('/api/v1/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id || "${attempt.razorpayOrderId}",
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature || 'simulated_signature_verified'
            })
          });
        } catch (e) {
          console.warn('[Hosted Checkout Verify]', e);
        }

        var redirectParam = new URLSearchParams(window.location.search).get('redirect_url');
        var baseReturn = redirectParam || "rippleup://payment-callback";
        var separator = baseReturn.includes('?') ? '&' : '?';
        var returnUrl = baseReturn + separator +
          "razorpay_order_id=" + encodeURIComponent(response.razorpay_order_id || "${attempt.razorpayOrderId}") +
          "&razorpay_payment_id=" + encodeURIComponent(response.razorpay_payment_id) +
          "&razorpay_signature=" + encodeURIComponent(response.razorpay_signature || '') +
          "&contributionId=${attempt.contributionId}" +
          "&status=success";

        window.location.href = returnUrl;
      }
    };

    if (isRealOrder) {
      options.order_id = "${attempt.razorpayOrderId}";
    }

    function openCheckout() {
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          alert('Payment Failed: ' + (resp.error ? resp.error.description : 'Unknown error'));
        });
        rzp.open();
      } catch (e) {
        alert("Failed to initialize Razorpay: " + e.message);
      }
    }

    function cancelPayment() {
      var redirectParam = new URLSearchParams(window.location.search).get('redirect_url');
      var baseReturn = redirectParam || "rippleup://payment-callback";
      var separator = baseReturn.includes('?') ? '&' : '?';
      window.location.href = baseReturn + separator + "status=cancelled";
    }

    // Auto open on load
    window.onload = function() {
      setTimeout(openCheckout, 300);
    };
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  })
);

// POST /payments/razorpay/verify - Verify Razorpay payment
router.post(
  '/payments/razorpay/verify',
  validate({ body: verifyPaymentSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    let effectiveUserId: string | undefined = undefined;

    // 1. Try extracting user from Bearer token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token.startsWith('demo-')) {
        await resolveDemoUser(req, token);
        effectiveUserId = req.userId;
      }
    }

    // 2. Resolve user from the payment attempt record
    if (!effectiveUserId) {
      const attempt = await prisma.paymentAttempt.findUnique({
        where: { razorpayOrderId: req.body.razorpayOrderId },
        select: { contribution: { select: { userId: true } } },
      });
      effectiveUserId = attempt?.contribution?.userId;
    }

    if (!effectiveUserId) {
      effectiveUserId = await userService.getOrCreateGuestUser();
    }

    const result = await contributionService.verifyPayment(effectiveUserId, req.body);
    sendSuccess(res, result);
  })
);

// POST /webhooks/razorpay - Razorpay webhook
// NOTE: This route needs raw body for signature verification.
// The raw body is set up in app.ts via express.raw() on this specific path.
router.post(
  '/webhooks/razorpay',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      throw ApiError.badRequest('Missing webhook signature');
    }

    // Get raw body - stored by express.raw() middleware
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    await contributionService.handleWebhook(req.body);

    // Razorpay expects 200 response
    sendSuccess(res, { received: true });
  })
);

export default router;
