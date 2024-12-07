import express from 'express';
import { IPublicRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { BadRequestError } from '@core/ApiError';
import PaymentRepo from '@database/repository/PaymentRepo';
import Logger from '@core/Logger';
import coinbase from '@core/integration/payment/Coinbase';
import { coinbaseSecret } from '@config';
import { PaymentMethod } from '@database/models/Payment';

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req: IPublicRequest, res) => {
    const sig = req.headers['x-cc-webhook-signature'] as string;
    const Webhook = coinbase.Webhook;
    const payload = req.body;

    if (!sig) throw new BadRequestError(ApiMessage.BadRequest);

    try {
      await Webhook.verifySigHeader(payload, sig, coinbaseSecret);
    } catch (error) {
      Logger.error(error);
      throw new BadRequestError(ApiMessage.InvalidSignature);
    }

    const event: any = Webhook.verifyEventBody(payload, sig, coinbaseSecret);
    const tid = event.data.metadata.paymentId;
    let find = null;
    switch (event.type) {
      case 'charge:confirmed':
        find = await PaymentRepo.findById(tid);

        await PaymentRepo.processPayment(
          find,
          'success',
          PaymentMethod.Coinbase,
        );
        break;
      case 'charge:failed':
        find = await PaymentRepo.findById(tid);

        await PaymentRepo.processPayment(
          find,
          'failed',
          PaymentMethod.Coinbase,
        );
        break;
    }

    res.json({ received: true });
  }),
);

export default router;
