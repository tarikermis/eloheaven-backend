import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import _ from 'lodash';
import authentication from '@core/auth/authentication';
import validator from '@helpers/validator';
import PaymentRepo from '@database/repository/PaymentRepo';
import IPayment, {
  PaymentMethod,
  PaymentScope,
  PaymentState,
} from '@database/models/Payment';
import { createCheckoutSession } from '@core/integration/payment/Stripe';
import { createCharge } from '@core/integration/payment/Coinbase';
import { convertCurrency } from '@helpers/currency';
import { safeInt } from '@helpers/number';
import { BadRequestError } from '@core/ApiError';
import { baseDomain } from '@config';
import { createCheckoutSessionPaypal } from '@core/integration/payment/Paypal';

const router = express.Router();

router.post(
  '/',
  authentication,
  validator(schema.addFunds),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const convert = await convertCurrency(req.body.amount, req.currency);

    const payment = {
      target: req.user._id,
      scope: PaymentScope.AddFunds,
      method: req.body.method,
      amount: safeInt(convert),
      state: PaymentState.Pending,
    } as IPayment;

    if (convert <= 0) {
      throw new BadRequestError(ApiMessage.SomethingWrong);
    }

    const productName = `Odin | Add Funds (${req.user.username})`;
    const productDescription = `Add Funds (${req.user.email}) (${
      req.body.amount
    } ${req.currency.toUpperCase()})`;
    const createdPayment = await PaymentRepo.create(payment);
    let createdSession;

    switch (req.body.method) {
      //? Method:
      //? Stripe
      case PaymentMethod.Stripe:
        createdSession = await createCheckoutSession({
          product: {
            name: productName,
            images: [`${baseDomain}/img/logo.png`],
            metadata: {
              paymentId: createdPayment._id.toString(),
            },
          },
          email: req.user.email,
          amount: req.body.amount,
          currency: req.currency,
        });

        createdPayment.details = {
          id: createdSession.id,
          description: 'Add funds (Stripe)',

          userCurrency: req.currency,
          userProvidedAmount: req.body.amount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);
        break;
        //? Method:

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);
        break;

      //paypal
      case PaymentMethod.Paypal:
        createdSession = await createCheckoutSessionPaypal({
          product: {
            name: productName,
            images: [`${baseDomain}/img/logo.png`],
            metadata: {
              paymentId: createdPayment._id.toString(),
            },
          },
          email: req.user.email,
          amount: req.body.amount,
          currency: req.currency,
        });

        createdPayment.details = {
          id: createdSession.id,
          description: 'Add funds (Paypal)',

          userCurrency: req.currency,
          userProvidedAmount: req.body.amount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);
        break;
        //? Method:

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);
        break;

      //? Method:
      //? Coinbase
      case PaymentMethod.Coinbase:
        createdSession = await createCharge({
          charge: {
            name: productName,
            description: productDescription,
            metadata: {
              paymentId: createdPayment._id.toString(),
            },
            amount: req.body.amount,
            currency: req.currency,
          },
        });

        createdPayment.details = {
          id: createdSession.id,
          description: 'Add funds (Coinbase)',

          userCurrency: req.currency,
          userProvidedAmount: req.body.amount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.hosted_url,
        }).send(res);
        break;
    }
  }),
);

export default router;
