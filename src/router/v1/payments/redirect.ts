import express from 'express';
import schema from './_schema';
import { IPublicRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';
import PaymentRepo from '@database/repository/PaymentRepo';
import { BadRequestError } from '@core/ApiError';
import { sha256 } from '@helpers/hash';
import { PaymentScope, PaymentState } from '@database/models/Payment';
import OrderRepo from '@database/repository/OrderRepo';
import { OrderState } from '@database/models/Order';
import UserRepo from '@database/repository/UserRepo';
import { baseDomain } from '@config';
import { TransactionTag } from '@database/models/Transaction';
import ChatRepo from '@database/repository/ChatRepo';
const router = express.Router();

router.get(
  '/:result/:payment_id/:payment_secret',
  validator(schema.redirect, ValidationSource.PARAM),
  asyncHandler(async (req: IPublicRequest, res) => {
    const payment = await PaymentRepo.findById(req.params.payment_id);
    if (!payment) {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }

    const successSecret = sha256(`eloheaven|${req.params.payment_id}|success`);
    const cancelSecret = sha256(`eloheaven|${req.params.payment_id}|cancel`);

    switch (req.params.result) {
      case 'success':
        if (req.params.payment_secret !== successSecret)
          throw new BadRequestError(ApiMessage.InvalidSignature);

        const gtmLink = `?gtm=true&transaction_id=${payment._id.toString()}&currency=${
          payment.details.userCurrency
        }&payment_amount=${payment.details.userProvidedAmount}`;

        switch (payment.scope) {
          case PaymentScope.Order:
            const order = await OrderRepo.findById(payment.target);

            if (!order) return res.redirect(baseDomain);
            return res.redirect(
              `${baseDomain}/dashboard/order/${order.orderId}${gtmLink}`,
            );
            break;
          case PaymentScope.AddFunds:
            return res.redirect(`${baseDomain}${gtmLink}`);
            break;
        }
        break;
      case 'cancel':
        if (req.params.payment_secret !== cancelSecret)
          throw new BadRequestError(ApiMessage.InvalidSignature);

        switch (payment.scope) {
          case PaymentScope.Order:
            const order = await OrderRepo.findById(payment.target);
            if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

            // Update order state
            order.state = OrderState.Cancelled;
            await ChatRepo.createSystemMsg(
              order,
              'Your order cancelled! Reason: Redirect Failed.',
            );
            await OrderRepo.updateInfo(order);

            // Refund used balance
            if (
              payment.details.refundBalance &&
              payment.details.userId &&
              payment.details.refundAmount
            ) {
              const user = await UserRepo.findById(payment.details.userId);
              if (user) {
                await UserRepo.updateBalance(
                  'AddBalance',
                  user,
                  payment.details.refundAmount,
                  `Refund balance for order #${order.orderId} (Manual cancellation by user)`,
                  TransactionTag.Refund,
                );
              }
            }
            break;
        }

        // Update state to failed
        payment.state = PaymentState.Failed;
        await PaymentRepo.updateInfo(payment);

        res.redirect(baseDomain);
        break;
      default:
        throw new BadRequestError(ApiMessage.AccessDenied);
    }

    return res.redirect(baseDomain);
  }),
);

export default router;
