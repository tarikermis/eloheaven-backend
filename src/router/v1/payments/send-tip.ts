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
import { convertCurrency } from '@helpers/currency';
import { realValue, safeFloat, safeInt } from '@helpers/number';
import OrderRepo from '@database/repository/OrderRepo';
import { BadRequestError } from '@core/ApiError';
import { OrderState } from '@database/models/Order';
import UserRepo from '@database/repository/UserRepo';
import { baseDomain, systemCurrency } from '@config';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import { createCharge } from '@core/integration/payment/Coinbase';
import SystemRepo from '@database/repository/SystemRepo';
import { TransactionTag } from '@database/models/Transaction';
import { createCheckoutSessionPaypal } from '@core/integration/payment/Paypal';

const router = express.Router();

router.post(
  '/',
  authentication,
  validator(schema.sendTip),
  asyncHandler(async (req: IProtectedRequest, res) => {
    //! setup
    const settings = await SystemRepo.getSettings();
    const option_useBalance = req.body.useBalance;
    const tipAmount_safe = safeInt(req.body.amount);
    const convertTipToSys = await convertCurrency(tipAmount_safe, req.currency);
    const tipAmount_sys = convertTipToSys;
    const tipAmount_display = realValue(tipAmount_sys);
    const userBalance_sys = req.user.balance;
    const convertBalToCur = await convertCurrency(
      userBalance_sys,
      systemCurrency as any,
      req.currency,
    );
    const userBalance_display = realValue(convertBalToCur);

    const order = await OrderRepo.findById(req.body.order);

    const availableStates = [
      OrderState.Boosting,
      OrderState.VerificationRequired,
      OrderState.Completed,
    ];

    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    if (!availableStates.includes(order.state))
      throw new BadRequestError(ApiMessage.OrderNotAvailable);

    if (
      order.customer &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }

    if (!order.booster) throw new BadRequestError(ApiMessage.BoosterNotFound);
    const booster = await UserRepo.findById(order.booster._id);
    if (!booster) throw new BadRequestError(ApiMessage.BoosterNotFound);

    //! process
    let payAmount_sys = tipAmount_sys;

    await OrderRepo.closeAllOrders(req.user, OrderState.NotPaid, order);

    //* Balance enough, subtract balance and pay booster
    if (option_useBalance && userBalance_sys >= tipAmount_sys) {
      await UserRepo.updateBalance(
        'SubtractBalance',
        req.user,
        tipAmount_sys,
        `Send tip (${booster.username}) to order #${order.orderId})`,
        TransactionTag.Normal,
      );

      await AuditLogRepo.insert(
        `Send tip for order #${order.orderId}. Balance used as method.`,
        LogScope.Order,
        req.user,
      );

      const receive_sys =
        tipAmount_sys - (tipAmount_sys / 100) * settings.tipTax;

      await UserRepo.updateBalance(
        'AddBalance',
        booster,
        receive_sys,
        `Receive tip for order #${order.orderId}`,
        TransactionTag.Tip,
      );

      return new SuccessResponse(ApiMessage.Success, {
        url: `/dashboard/order/${order.orderId}`,
      }).send(res);
    }

    if (
      option_useBalance &&
      userBalance_sys < tipAmount_sys &&
      userBalance_sys > 0
    ) {
      payAmount_sys = tipAmount_sys - userBalance_sys;

      await UserRepo.updateBalance(
        'SubtractBalance',
        req.user,
        userBalance_sys,
        `Use remaning balance for order #${order.orderId} to send tip.`,
        TransactionTag.Normal,
      );
    }

    const payAmount_display = await convertCurrency(
      payAmount_sys,
      systemCurrency as any,
      req.currency,
    );
    const checkoutPaymentAmount = realValue(payAmount_display);

    const payment = {
      target: order.booster._id,
      scope: PaymentScope.Tip,
      method: req.body.method,
      amount: tipAmount_sys,
      state: PaymentState.Pending,
    } as IPayment;

    if (payAmount_sys <= 0 || checkoutPaymentAmount <= 0) {
      throw new BadRequestError(ApiMessage.SomethingWrong);
    }

    const productName = `Odin | Order Tip #${order.orderId}`;
    const productDescription = `Booster: ${booster.username} ${
      req.body.useBalance
        ? `(used: ${userBalance_display} ${req.currency.toUpperCase()})`
        : ''
    }`;
    const createdPayment = await PaymentRepo.create(payment);
    let createdSession;

    switch (req.body.method) {
      //? Method:
      //? Stripe
      case PaymentMethod.Stripe:
        createdSession = await createCheckoutSession({
          product: {
            name: productName,
            description: productDescription,
            images: [`${baseDomain}/img/logo.png`],
            metadata: {
              userBalance: userBalance_sys,
              paymentId: createdPayment._id.toString(),
            },
          },
          email: req.user.email,
          amount: checkoutPaymentAmount,
          currency: req.currency,
        });

        createdPayment.details = {
          id: createdSession.id,
          description: `Pay Order #${order.orderId} (Stripe)`,
          // Remanining balance part
          userId: req.user._id,
          refundBalance: option_useBalance,
          refundAmount: safeFloat(userBalance_sys),

          userCurrency: req.currency,
          userProvidedAmount: checkoutPaymentAmount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);

      //? Method:
      //? Paypal
      case PaymentMethod.Paypal:
        createdSession = await createCheckoutSessionPaypal({
          product: {
            name: productName,
            description: productDescription,
            images: [`${baseDomain}/img/logo.png`],
            metadata: {
              userBalance: userBalance_sys,
              paymentId: createdPayment._id.toString(),
            },
          },
          email: req.user.email,
          amount: checkoutPaymentAmount,
          currency: req.currency,
        });

        createdPayment.details = {
          id: createdSession.id,
          description: `Pay Order #${order.orderId} (Paypal)`,
          // Remanining balance part
          userId: req.user._id,
          refundBalance: option_useBalance,
          refundAmount: safeFloat(userBalance_sys),

          userCurrency: req.currency,
          userProvidedAmount: checkoutPaymentAmount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);

      //? Method:
      //? Coinbase
      case PaymentMethod.Coinbase:
        createdSession = await createCharge({
          charge: {
            name: productName,
            description: productDescription,
            metadata: {
              userBalance: userBalance_sys,
              paymentId: createdPayment._id.toString(),
            },
            amount: checkoutPaymentAmount.toString(),
            currency: req.currency,
          },
        });

        createdPayment.details = {
          id: createdSession.id,
          description: `Pay Order #${order.orderId} (Coinbase)`,
          // Remanining balance part
          userId: req.user._id,
          refundBalance: option_useBalance,
          refundAmount: safeFloat(userBalance_sys),

          userCurrency: req.currency,
          userProvidedAmount: checkoutPaymentAmount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.hosted_url,
        }).send(res);
    }
  }),
);

export default router;
