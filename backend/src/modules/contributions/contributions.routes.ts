import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate, uuidParamSchema } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { createContributionSchema, verifyPaymentSchema } from './contributions.schema.js';
import { contributionService } from './contributions.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { verifyWebhookSignature } from '../../lib/razorpay.js';
import { ApiError } from '../../utils/api-error.js';

const router = Router();

// POST /campaigns/:id/contributions - Create a contribution
router.post(
  '/campaigns/:id/contributions',
  ...authenticate,
  validate({ params: uuidParamSchema, body: createContributionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await contributionService.createContribution(
      req.params.id as string,
      req.userId!,
      req.body
    );
    sendCreated(res, result);
  })
);

// GET /contributions/:id - Get contribution detail
router.get(
  '/contributions/:id',
  ...authenticate,
  validate({ params: uuidParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const contribution = await contributionService.getContributionForUser(
      req.params.id as string,
      req.userId!
    );
    sendSuccess(res, contribution);
  })
);

// POST /payments/razorpay/verify - Verify Razorpay payment
router.post(
  '/payments/razorpay/verify',
  ...authenticate,
  validate({ body: verifyPaymentSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await contributionService.verifyPayment(req.userId!, req.body);
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
