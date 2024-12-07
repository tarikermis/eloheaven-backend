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
import { io } from '../../../server';
import SystemRepo from '@database/repository/SystemRepo';
import { EmbedBuilder } from 'discord.js';
import { baseColor, baseDomain } from '@config';
import IChatMessage, { ChatChannel } from '@database/models/Chat';
import { sendMessageWithEmbed } from '@core/discord/utils/channelUtils';

const router = express.Router();

router.post(
  '/:orderId/:channel',
  authentication,
  validator(schema.chat, ValidationSource.PARAM),
  validator(schema.sendMessage),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(
      req.params.orderId as unknown as Types.ObjectId,
      '+chatHistory +booster +customer',
    );

    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    let channel = req.params.channel;

    const isCustomer = OrderRepo.isCustomer(order, req.user);
    const isAdmin = OrderRepo.isAdmin(req.user);
    const isBooster = OrderRepo.isBooster(order, req.user);

    if (
      req.params.channel === ChatChannel.Management &&
      (isAdmin || isCustomer)
    )
      channel = ChatChannel.Management;

    if (isAdmin || isCustomer || isBooster) {
      const roomName = order._id.toString() + '_' + channel;

      if (isBooster && channel === ChatChannel.Management)
        throw new BadRequestError(ApiMessage.AccessDenied);

      const message = {
        message: req.body.message,
        channel,
        order: order,
        sender: req.user,
      } as IChatMessage;

      const createdMsg = await ChatRepo.create(order, message);

      switch (channel) {
        case ChatChannel.Management:
          // notify admins when customer send a message
          // because boosters are not able to see management channel
          if (isCustomer) {
            const settings = await SystemRepo.getSettings();
            const embed = new EmbedBuilder()
              .setTitle(order.customer?.username ?? 'Unknown Customer')
              .setAuthor({
                name: `Order #${order.orderId}`,
                url: `${baseDomain}/dashboard/order/${order.orderId}`,
              })
              .setDescription(createdMsg.message ?? 'Unknown Message')
              .setTimestamp(Date.now())
              .setColor(baseColor as any).data;

            const mentionMessage = '<@&1061775607169552505>';

            sendMessageWithEmbed(
              settings.managementNotificationChannel,
              mentionMessage,
              embed,
            );
          }
          await ChatRepo.notify(roomName, order, 'customer');
          io.server.to(roomName).emit('new_chat_message', {
            channel,
            message: createdMsg,
          });
          break;
        case ChatChannel.General:
          io.server.to(roomName).emit('new_chat_message', {
            channel,
            message: createdMsg,
          });

          // Notify customer
          if (isBooster) {
            await ChatRepo.notify(roomName, order, 'customer');
          }

          // Notify Booster
          if (isCustomer) {
            await ChatRepo.notify(roomName, order, 'booster');
          }

          // Notify everyone
          if (isAdmin) {
            await ChatRepo.notify(roomName, order, 'booster');
            await ChatRepo.notify(roomName, order, 'customer');
          }

          break;
      }
      return new SuccessResponse(ApiMessage.Success).send(res);
    } else {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }
  }),
);

export default router;
