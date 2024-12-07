import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import { BadRequestError } from '@core/ApiError';
import validator from '@helpers/validator';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import { PermissionCode } from '@common/Permission';
import OrderRepo from '@database/repository/OrderRepo';
import IOrder, { OrderState } from '@database/models/Order';
import UserRepo from '@database/repository/UserRepo';
import { IOrderCredentials } from '@database/models/references/order/OrderCredentials';
import { TransactionTag } from '@database/models/Transaction';
import SystemRepo from '@database/repository/SystemRepo';
import { GameCode } from '@core/boost/Boost';
import { convertCurrency } from '@helpers/currency';
import { realValue, safeInt } from '@helpers/number';
import { sha1sum } from '@helpers/hash';
import { EmbedBuilder } from 'discord.js';
import { baseColor, baseDomain } from '@config';
import ChatRepo from '@database/repository/ChatRepo';
import { sendMailRich } from '@core/integration/mail/Nodemailer';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import { readFileSync } from 'fs';
import path from 'path';
import INotification from '@database/models/Notification';
import NotificationRepo from '@database/repository/NotificationRepo';
import { __clients, io } from '../../../server';
import { EventName } from '@common/EventName';
import { randomUUID } from 'crypto';
import { sendEmbedOnly } from '@core/discord/utils/channelUtils';

const router = express.Router();

router.put(
  '/info',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.editOrderDetails),
  asyncHandler(async (req: IProtectedRequest, res) => {
    let order = await OrderRepo.findById(req.body.id);
    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const newOrder = Object.assign(order, req.body.order as IOrder);

    order = await OrderRepo.updateInfo(newOrder);

    return new SuccessResponse(ApiMessage.OrderUpdated).send(res);
  }),
);

router.post(
  '/verify',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.verifyOrder),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(req.body.order);
    if (!order || !order.booster)
      throw new BadRequestError(ApiMessage.OrderNotFound);

    const booster = await UserRepo.findById(order.booster._id);

    if (!booster) throw new BadRequestError(ApiMessage.BoosterNotFound);

    await OrderRepo.finishBoost(booster, order);

    if (req.body.amount && req.body.type) {
      let tag = req.body.tag;
      if (!tag) tag = TransactionTag.Penalty;

      const safeAmount = safeInt(req.body.amount);
      const convert = await convertCurrency(safeAmount, req.currency);

      await UserRepo.updateBalance(
        req.body.type,
        booster,
        convert,
        req.body.description,
        tag,
        req.user,
      );
    }

    // Order completed send mail to customer
    if (order.customer) {
      const customer = await UserRepo.findById(order.customer._id);
      if (customer) {
        let template = readFileSync(
          path.join(
            __dirname +
              '../../../../../src/data/templates/order-completed.html',
          ),
          'utf-8',
        );

        template = template.replace(
          '{{track_order_link}}',
          `${baseDomain}/dashboard/order/${order.orderId}`,
        );
        template = template.replace(
          '{{order_title}}',
          order.title ?? 'Boost Service',
        );
        template = template.replace(
          '{{order_price}}',
          `${realValue(order.totalPrice).toString()}`,
        );

        sendMailRich(
          customer.email,
          'Your order has been completed!',
          template,
          ['eloheaven.gg+7f9b5cf7a2@invite.trustpilot.com'],
          [
            {
              filename: 'check.gif',
              path: path.join(
                __dirname +
                  '../../../../../src/data/templates/images/check.gif',
              ),
              cid: 'check',
            },
            {
              filename: 'facebook.png',
              path: path.join(
                __dirname +
                  '../../../../../src/data/templates/images/facebook.png',
              ),
              cid: 'facebook',
            },
            {
              filename: 'twitter.png',
              path: path.join(
                __dirname +
                  '../../../../../src/data/templates/images/twitter.png',
              ),
              cid: 'twitter',
            },
            {
              filename: 'instagram.png',
              path: path.join(
                __dirname +
                  '../../../../../src/data/templates/images/instagram.png',
              ),
              cid: 'instagram',
            },
            {
              filename: 'logo.png',
              path: path.join(
                __dirname + '../../../../../src/data/templates/images/logo.png',
              ),
              cid: 'logo',
            },
          ],
        );
      }
    }

    return new SuccessResponse(ApiMessage.OrderUpdated).send(res);
  }),
);

router.put(
  '/state',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.editOrderState),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(req.body.id);
    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    switch (req.body.state) {
      case OrderState.WaitingForBooster:
        order.embed = {
          title: order.title,
          fields: [],
        };
        await OrderRepo.deleteBooster(req.body.id);
        await OrderRepo.updateInfo(order);
        await OrderRepo.notifyBoosters(order);
        break;
      case OrderState.Completed:
        // Pay money to booster
        if (order.booster) {
          const booster = await UserRepo.findById(order.booster._id);

          if (booster && order.state === OrderState.VerificationRequired) {
            const calcPric = UserRepo.calculateBoosterPrice(booster, order);
            order.flagTime = new Date();
            order.DeletionFlag = true;

            // Save the updated order
            await OrderRepo.updateFlag(order);
            const safeAmount = calcPric;
            const convert = await convertCurrency(safeAmount, req.currency);
            await UserRepo.updateBalance(
              'AddBalance',
              booster,
              convert,
              `Finished order #${order.orderId}`,
              TransactionTag.BoostPay,
              req.user,
            );
          }
        }
        order.flagTime = new Date();
        order.DeletionFlag = true;

        // Save the updated order
        await OrderRepo.updateInfo(order);
        break;
      case OrderState.Cancelled:
        // Refund money to customer
        if (order.customer) {
          if (
            order.state !== OrderState.NotPaid &&
            order.state !== OrderState.Cancelled
          ) {
            const customer = await UserRepo.findById(order.customer._id);
            order.flagTime = new Date();
            order.DeletionFlag = true;
            if (customer) {
              await UserRepo.updateBalance(
                'AddBalance',
                customer,
                order.totalPrice,
                `Canceled order #${order.orderId}`,
                TransactionTag.Refund,
                req.user,
              );
            }
          }

          await ChatRepo.createSystemMsg(
            order,
            `Your order has been cancelled by ${req.user.username}`,
          );
        }
        break;
    }

    order.state = req.body.state as OrderState;

    await OrderRepo.updateInfo(order);

    await AuditLogRepo.insert(
      `Order #${order.orderId} changed to ${order.state}`,
      LogScope.Order,
      req.user,
    );

    return new SuccessResponse(ApiMessage.OrderUpdated).send(res);
  }),
);

router.put(
  '/booster',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.editOrderBooster),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(req.body.id);
    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const booster = await UserRepo.findById(req.body.booster);

    if (!booster) throw new BadRequestError(ApiMessage.BoosterNotFound);

    order.booster = booster;

    if (order.state === OrderState.WaitingForBooster) {
      order.state = OrderState.Boosting;
      await ChatRepo.createSystemMsg(
        order,
        `${booster.username} has been assigned to order by ${req.user.username}.`,
      );
    }

    await OrderRepo.updateInfo(order);

    // notify booster
    const boosterId = booster._id.toString();

    // Get booster connection
    const findBooster = __clients.filter((client) => client.sub === boosterId);

    // Connected
    if (findBooster.length > 0) {
      io.server.to(findBooster[0].id).emit(EventName.ShowNotification, {
        notification_id: randomUUID(),
        message: `You have been assigned to order #${order.orderId}`,
      });
    }
    const notification = {
      user: booster,
      title: 'You have been assigned to order by admin!',
      description: `You have been assigned to order #${order.orderId} by ${req.user.username}.`,
      redirectUrl: `/dashboard/order/${order.orderId}`,
    } as INotification;
    NotificationRepo.create(notification);

    await AuditLogRepo.insert(
      `${booster.username} assigned to order #${order.orderId}.`,
      LogScope.Order,
      req.user,
    );

    return new SuccessResponse(ApiMessage.OrderUpdated).send(res);
  }),
);

router.delete(
  '/booster',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.deleteOrderBooster),
  asyncHandler(async (req: IProtectedRequest, res) => {
    await OrderRepo.deleteBooster(req.body.id);
    return new SuccessResponse(ApiMessage.OrderUpdated).send(res);
  }),
);

router.delete(
  '/photos',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.deleteOrderPhotos),
  asyncHandler(async (req: IProtectedRequest, res) => {
    await OrderRepo.deletePhotos(req.body.id);
    return new SuccessResponse(ApiMessage.OrderUpdated).send(res);
  }),
);

router.put(
  '/credentials',
  authentication,
  validator(schema.updateOrderCredentials),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(req.body.id);
    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);
    if (order.state === OrderState.NotPaid)
      throw new BadRequestError(ApiMessage.OrderNotAvailable);

    const isCustomer = await OrderRepo.isCustomer(order, req.user);
    const isAdmin = await OrderRepo.isAdmin(req.user);
    const isBooster = await OrderRepo.isBooster(order, req.user);

    // Check if the user is a booster
    if (isBooster) {
      // Return an error if the user is a booster and not assigned to the order
      if (
        !order.booster ||
        order.booster._id.toString() !== req.user._id.toString()
      ) {
        throw new BadRequestError(ApiMessage.AccessDenied);
      }
    }

    const firstAttempt = !order.credentials ? true : false;

    if (isCustomer || isAdmin || isBooster) {
      const savex = {
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        riotId: req.body.riotId,
        createdAt: new Date(),
      } as IOrderCredentials;

      const ss = await SystemRepo.getSettings();

      if (order.state === OrderState.WaitingForAccount) {
        order.state = order.booster
          ? OrderState.Boosting
          : OrderState.WaitingForBooster;
      }

      savex.hash = sha1sum(`${order.game}|${req.body.nickname.toLowerCase()}`);

      const foundBefore = await OrderRepo.findAccountByHash(savex.hash);
      // notify admins for valorant accounts
      if (!foundBefore && order.game === GameCode.Valorant) {
        const name = encodeURIComponent(req.body.nickname.replaceAll('#', '-'));
        sendEmbedOnly(
          ss.newAccountNotificationChannel,
          new EmbedBuilder()
            .setTitle(order.customer?.username ?? 'Unknown Customer')
            .setAuthor({
              name: `Order #${order.orderId}`,
              url: `${baseDomain}/dashboard/order/${order.orderId}`,
            })
            .setDescription(
              `
            New Valorant Account! Please make sure the profile is public.
            [View Order](${baseDomain}/dashboard/order/${order.orderId})
            [Valorant Profile](https://dak.gg/valorant/en/profile/${name})
            `,
            )
            .setTimestamp(Date.now())
            .setColor(baseColor as any).data,
        );
      }

      order.credentials = savex;
      await OrderRepo.updateInfo(order);

      if (firstAttempt) {
        //? start boost after first credentials input
        order.startedAt = new Date();
        await OrderRepo.updateInfo(order);

        //? notify then
        await OrderRepo.notifyBoosters(order);
      }
    } else {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }
  }),
);

export default router;
