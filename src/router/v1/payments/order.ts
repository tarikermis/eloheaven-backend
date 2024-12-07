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
import { realValue } from '@helpers/number';
import OrderRepo from '@database/repository/OrderRepo';
import { BadRequestError } from '@core/ApiError';
import { OrderState } from '@database/models/Order';
import UserRepo from '@database/repository/UserRepo';
import { baseDomain, systemCurrency } from '@config';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import { createCharge } from '@core/integration/payment/Coinbase';
import { TransactionTag } from '@database/models/Transaction';
import CouponRepo from '@database/repository/CouponRepo';
import { createCheckoutSessionPaypal } from '@core/integration/payment/Paypal';

const router = express.Router();

router.post(
  '/',
  authentication,
  validator(schema.payOrder),
  asyncHandler(async (req: IProtectedRequest, res) => {
    //! setup
    const option_useBalance = req.body.useBalance;
    const userBalance_sys = req.user.balance;
    const convertBalToCur = await convertCurrency(
      userBalance_sys,
      systemCurrency as any,
      req.currency,
    );
    const userBalance_display = realValue(convertBalToCur);

    //! check
    const order = await OrderRepo.findById(req.body.order);

    if (!order || order.state !== OrderState.NotPaid)
      throw new BadRequestError(ApiMessage.OrderNotFound);

    if (
      order.customer &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }

    const orderPrice_sys = order.totalPrice;

    //! process
    let payAmount_sys = orderPrice_sys;

    await OrderRepo.closeAllOrders(req.user, OrderState.NotPaid, order);

    //* Balance enough, subtract balance and update order.
    if (option_useBalance && userBalance_sys >= orderPrice_sys) {
      await UserRepo.updateBalance(
        'SubtractBalance',
        req.user,
        orderPrice_sys,
        `Order #${order.orderId} paid.`,
        TransactionTag.Normal,
      );

      await AuditLogRepo.insert(
        `Order #${order.orderId} paid. Balance used as method.`,
        LogScope.Order,
        req.user,
      );

      order.state = OrderRepo.getNextState(order);

      if (order.state === OrderState.WaitingForBooster)
        order.startedAt = new Date();

      // decrease coupon.limit
      if (order.coupon) {
        const coupon = await CouponRepo.findById(order.coupon._id);
        if (coupon) {
          coupon.limit = coupon.limit - 1 > 0 ? coupon.limit - 1 : 0;
          await CouponRepo.updateInfo(coupon);
        }
      }

      await OrderRepo.updateInfo(order);

      if (order.state === OrderState.WaitingForBooster)
        await OrderRepo.notifyBoosters(order);

      OrderRepo.mailForCreatedOrder(order);

      return new SuccessResponse(ApiMessage.Success, {
        url: `/dashboard/order/${order.orderId}`,
      }).send(res);
    }

    if (
      option_useBalance &&
      userBalance_sys < orderPrice_sys &&
      userBalance_sys > 0
    ) {
      payAmount_sys = orderPrice_sys - userBalance_sys;

      await UserRepo.updateBalance(
        'SubtractBalance',
        req.user,
        userBalance_sys,
        `Use remaning balance for order #${order.orderId} to pay.`,
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
      target: order._id,
      scope: PaymentScope.Order,
      method: req.body.method,
      amount: payAmount_sys,
      state: PaymentState.Pending,
    } as IPayment;

    if (payAmount_sys <= 0 || checkoutPaymentAmount <= 0) {
      throw new BadRequestError(ApiMessage.SomethingWrong);
    }

    const productName = `Odin | Order #${order.orderId}`;
    const productDescription = `${order.title} ${
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
          refundAmount: userBalance_sys,

          userCurrency: req.currency,
          userProvidedAmount: checkoutPaymentAmount,
        };

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
          refundAmount: userBalance_sys,

          userCurrency: req.currency,
          userProvidedAmount: checkoutPaymentAmount,
        };

        // make sure its updated before redirect to avoid bugs
        await PaymentRepo.updateInfo(createdPayment);

        return new SuccessResponse(ApiMessage.Success, {
          ..._.pick(createdPayment, ['_id']),
          url: createdSession.url,
        }).send(res);
        break;
      //? Method:

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
          refundAmount: userBalance_sys,

          userCurrency: req.currency,
          userProvidedAmount: checkoutPaymentAmount,
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
