import express from 'express';
import { IPublicRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { stripePaypalEndpointSecret } from '@config';
import PaymentRepo from '@database/repository/PaymentRepo';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import { BadRequestError } from '@core/ApiError';
import Stripe from 'stripe';
import { PaymentMethod } from '@database/models/Payment';
import paypal, { createCustomerPaypal } from '@core/integration/payment/Paypal';
const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req: IPublicRequest, res) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      await AuditLogRepo.insert(
        `[Paypal Webhook] Signature header not found!`,
        LogScope.Integration,
      );
      throw new BadRequestError(ApiMessage.HeaderNotFound);
    }

    let event: Stripe.Event;

    const payload = req.body;

    try {
      event = paypal.webhooks.constructEvent(
        payload,
        sig,
        stripePaypalEndpointSecret,
      );
    } catch (err) {
      await AuditLogRepo.insert(
        `[Stripe Webhook] Signature validation failed!`,
        LogScope.Integration,
      );
      throw new BadRequestError(ApiMessage.InvalidSignature);
    }

    let session = null;
    let find = null;
    switch (event.type) {
      case 'checkout.session.completed':
        session = event.data.object as any;
        find = await PaymentRepo.findByDetail({
          'details.id': session.id,
        });

        await PaymentRepo.processPayment(find, 'success', PaymentMethod.Paypal);

        await createCustomerPaypal({
          name: session.customer_details.name,
          email: session.customer_details.email,
          phone: session.customer_details.phone,
        });

        break;
      case 'checkout.session.expired':
        session = event.data.object as any;
        find = await PaymentRepo.findByDetail({
          'details.id': session.id,
        });

        await PaymentRepo.processPayment(find, 'failed', PaymentMethod.Paypal);

        break;
    }

    res.json({ received: true });
  }),
);

export default router;
