import { Types } from 'mongoose';
import IPayment, {
  PaymentMethod,
  PaymentModel,
  PaymentScope,
  PaymentState,
} from '@database/models/Payment';
import AuditLogRepo from './AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import { BadRequestError } from '@core/ApiError';
import { ApiMessage } from '@common/ApiMessage';
import UserRepo from './UserRepo';
import OrderRepo from './OrderRepo';
import { OrderState } from '@database/models/Order';
import CouponRepo from './CouponRepo';
import { TransactionTag } from '@database/models/Transaction';
import { realValue, safeFloat, safeInt } from '@helpers/number';
import SystemRepo from './SystemRepo';
import ChatRepo from './ChatRepo';
import RaffleTicketRepo from './RaffleTicketRepo';
import { convertCurrency } from '@helpers/currency';
import { systemCurrency } from '@config';

export default class PaymentRepo {
  public static findById(_id: string): Promise<IPayment | null> {
    return PaymentModel.findOne({ _id: new Types.ObjectId(_id) })
      .lean<IPayment>()
      .exec();
  }

  public static findByDetail(detail: object): Promise<IPayment | null> {
    return PaymentModel.findOne(detail).lean<IPayment>().exec();
  }

  public static async create(payment: IPayment): Promise<IPayment> {
    const now = new Date();
    payment.updatedAt = payment.createdAt = now;
    payment.amount = safeFloat(payment.amount);
    const createdPayment = await PaymentModel.create(payment);
    return createdPayment;
  }

  public static updateInfo(payment: IPayment): Promise<IPayment> {
    const now = new Date();
    payment.updatedAt = now;
    return PaymentModel.updateOne(
      { _id: payment._id },
      { $set: { ...payment } },
    )
      .lean<IPayment>()
      .exec();
  }

  public static async processPayment(
    payment: IPayment | null,
    result: 'success' | 'failed',
    refWebhook: PaymentMethod,
  ) {
    if (!payment) {
      await AuditLogRepo.insert(
        `[${refWebhook} Webhook] Payment not found!`,
        LogScope.Integration,
      );
      throw new BadRequestError(ApiMessage.PaymentNotFound);
    }

    const sessId = payment.details.id;

    if (payment.state !== PaymentState.Pending) {
      await AuditLogRepo.insert(
        `[${refWebhook} Webhook] Payment has already been processed! ID: ${sessId}`,
        LogScope.Integration,
      );
      throw new BadRequestError(ApiMessage.PaymentHasAlreadyBeenProcessed);
    }

    switch (result) {
      case 'success':
        switch (payment.scope) {
          //? add-funds payment
          case PaymentScope.AddFunds:
            const user = await UserRepo.findById(payment.target);
            if (!user) {
              await AuditLogRepo.insert(
                `[${refWebhook} Webhook] User not found! ID: ${sessId}`,
                LogScope.Integration,
              );
              throw new BadRequestError(ApiMessage.UserNotFound);
            }

            await UserRepo.updateBalance(
              'AddBalance',
              user,
              payment.amount,
              payment.details?.description,
              TransactionTag.AddFunds,
            );

            // Update state to completed
            payment.state = PaymentState.Completed;
            await PaymentRepo.updateInfo(payment);

            //? Participate to latest raffle
            const val = await convertCurrency(
              realValue(payment.amount),
              payment.details.userCurrency as any,
              systemCurrency as any,
            );
            await RaffleTicketRepo.participate(user, val);
            break;

          //? send-tip payment
          case PaymentScope.Tip:
            const booster = await UserRepo.findById(payment.target);
            if (!booster) {
              await AuditLogRepo.insert(
                `[${refWebhook} Webhook] Booster not found! ID: ${sessId}`,
                LogScope.Integration,
              );
              throw new BadRequestError(ApiMessage.UserNotFound);
            }

            const system = await SystemRepo.getSettings();
            const tipRes =
              payment.amount -
              safeFloat((payment.amount / 100) * system.tipTax);

            await UserRepo.updateBalance(
              'AddBalance',
              booster,
              tipRes,
              payment.details?.description,
              TransactionTag.Tip,
            );

            // Update state to completed
            payment.state = PaymentState.Completed;
            await PaymentRepo.updateInfo(payment);

            if (payment.details.userId) {
              const user = await UserRepo.findById(payment.details.userId);
              if (user) {
                const val = await convertCurrency(
                  realValue(payment.amount),
                  payment.details.userCurrency as any,
                  systemCurrency as any,
                );
                //? Participate to latest raffle
                await RaffleTicketRepo.participate(user, val);
              }
            }
            break;
          //? order payment
          case PaymentScope.Order:
            const order = await OrderRepo.findById(payment.target);
            if (!order) {
              await AuditLogRepo.insert(
                `[${refWebhook} Webhook] Order not found! ID: ${sessId}`,
                LogScope.Integration,
              );
              throw new BadRequestError(ApiMessage.OrderNotFound);
            }

            // coupon.limit--
            if (order.coupon) {
              const coupon = await CouponRepo.findById(order.coupon._id);
              if (coupon) {
                coupon.limit = coupon.limit - 1 > 0 ? coupon.limit - 1 : 0;
                await CouponRepo.updateInfo(coupon);
              }
            }

            order.state = OrderRepo.getNextState(order);

            if (order.state === OrderState.WaitingForBooster) {
              order.startedAt = new Date();
              await OrderRepo.updateInfo(order);
              await OrderRepo.notifyBoosters(order);
            }

            await OrderRepo.updateInfo(order);
            OrderRepo.mailForCreatedOrder(order);

            // Update state to completed
            payment.state = PaymentState.Completed;
            await PaymentRepo.updateInfo(payment);

            if (payment.details.userId) {
              const user = await UserRepo.findById(payment.details.userId);
              if (user) {
                const val = await convertCurrency(
                  realValue(payment.amount),
                  payment.details.userCurrency as any,
                  systemCurrency as any,
                );

                //TODO: cashback amount hardcoded here update later
                //? Cashback
                const amount =
                  safeInt(payment.details.userProvidedAmount) * 0.03;
                await UserRepo.updateBalance(
                  'AddBalance',
                  user,
                  amount,
                  `Cashback for Order: #${order.orderId}`,
                );

                //? Participate to latest raffle
                await RaffleTicketRepo.participate(user, val);
              }
            }
            break;
        }
        break;
      case 'failed':
        switch (payment.scope) {
          case PaymentScope.Order:
            const order = await OrderRepo.findById(payment.target);
            if (!order) {
              await AuditLogRepo.insert(
                `[${refWebhook} Webhook] Order not found! ID: ${sessId}`,
                LogScope.Integration,
              );
              throw new BadRequestError(ApiMessage.OrderNotFound);
            }

            if (order.state == OrderState.NotPaid) {
              // Update order state
              order.state = OrderState.Cancelled;
              await ChatRepo.createSystemMsg(
                order,
                'Your order cancelled! (Payment Failed)',
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
                  const updateBalance = await UserRepo.updateBalance(
                    'AddBalance',
                    user,
                    payment.details.refundAmount,
                    `Refund balance for order #${order.orderId} (${refWebhook} session expired)`,
                    TransactionTag.Refund,
                  );
                }
              }
            }
            break;
          case PaymentScope.Tip:
            if (
              payment.details.refundBalance &&
              payment.details.userId &&
              payment.details.refundAmount
            ) {
              const user = await UserRepo.findById(payment.details.userId);
              if (user) {
                const updateBalance = await UserRepo.updateBalance(
                  'AddBalance',
                  user,
                  payment.details.refundAmount,
                  `Refund balance for tip. (${refWebhook} session expired)`,
                  TransactionTag.Refund,
                );
              }
            }
            break;
        }
        //? Set state to failed for all
        payment.state = PaymentState.Failed;
        await PaymentRepo.updateInfo(payment);
        break;
    }
    return true;
  }
}
