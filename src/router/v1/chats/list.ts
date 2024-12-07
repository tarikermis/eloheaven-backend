import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import { Types } from 'mongoose';
import { BadRequestError } from '@core/ApiError';
import validator, { ValidationSource } from '@helpers/validator';
import OrderRepo from '@database/repository/OrderRepo';
import ChatRepo from '@database/repository/ChatRepo';
import { ChatChannel } from '@database/models/Chat';

const router = express.Router();

router.get(
  '/:orderId/:channel/messages',
  authentication,
  validator(schema.chat, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(
      req.params.orderId as unknown as Types.ObjectId,
    );

    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const channel = req.params.channel;

    const isCustomer = OrderRepo.isCustomer(order, req.user);
    const isAdmin = OrderRepo.isAdmin(req.user);
    const isBooster = OrderRepo.isBooster(order, req.user);

    if (isBooster && channel !== ChatChannel.General)
      throw new BadRequestError(ApiMessage.AccessDenied);

    const result = await ChatRepo.getMessages(order, channel as any);
    if ((isAdmin || isCustomer || isBooster) && result) {
      return new SuccessResponse(ApiMessage.Success, result).send(res);
    } else {
      return new SuccessResponse(ApiMessage.AccessDenied).send(res);
    }
  }),
);

router.get(
  '/:orderId/unread-messages',
  authentication,
  validator(schema.unreadMessages, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(
      req.params.orderId as unknown as Types.ObjectId,
    );

    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const isCustomer = OrderRepo.isCustomer(order, req.user);
    const isAdmin = OrderRepo.isAdmin(req.user);
    const isBooster = OrderRepo.isBooster(order, req.user);

    if (isBooster) throw new BadRequestError(ApiMessage.AccessDenied);

    const general = await ChatRepo.getUnreadMessageCount(order, 'general');
    const management = await ChatRepo.getUnreadMessageCount(
      order,
      'management',
    );
    if (isAdmin || isCustomer || isBooster) {
      return new SuccessResponse(ApiMessage.Success, {
        general,
        management,
      }).send(res);
    } else {
      return new SuccessResponse(ApiMessage.AccessDenied).send(res);
    }
  }),
);

export default router;
