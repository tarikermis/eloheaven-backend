import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { BadRequestResponse, SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import { Types } from 'mongoose';
import { BadRequestError } from '@core/ApiError';
import validator, { ValidationSource } from '@helpers/validator';
import OrderRepo from '@database/repository/OrderRepo';
import ChatRepo from '@database/repository/ChatRepo';
import { ChatChannel } from '@database/models/Chat';
import { io } from '../../../server';

const router = express.Router();

router.delete(
  '/:orderId/:channel/:messageId',
  authentication,
  validator(schema.delMessage, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(
      req.params.orderId as unknown as Types.ObjectId,
    );

    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const channel = req.params.channel;
    const roomName = order._id.toString() + '_' + channel;

    const isAdmin = OrderRepo.isAdmin(req.user);
    const isBooster = OrderRepo.isBooster(order, req.user);

    if (isBooster && channel !== ChatChannel.General)
      throw new BadRequestError(ApiMessage.AccessDenied);

    if (isAdmin || isBooster) {
      const msg = await ChatRepo.findById(req.params.messageId);

      if (
        !msg ||
        (isBooster && msg.sender._id.toString() !== req.user._id.toString())
      )
        return new BadRequestResponse(ApiMessage.SomethingWrong).send(res);

      const result = await ChatRepo.deleteMessage(
        order,
        req.params.messageId as any,
      );

      io.server.to(roomName).emit('delete_chat_message', {
        channel,
        message: req.params.messageId,
      });

      return new SuccessResponse(ApiMessage.Success).send(res);
    }

    return new BadRequestResponse(ApiMessage.AccessDenied).send(res);
  }),
);

export default router;
