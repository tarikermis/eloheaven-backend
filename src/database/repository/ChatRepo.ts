import { EventName } from '@common/EventName';
import IChatMessage, { ChatChannel, ChatModel } from '@database/models/Chat';
import INotification from '@database/models/Notification';
import IOrder from '@database/models/Order';
import IUser from '@database/models/User';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';

import { __clients, io } from '../../server';
import NotificationRepo from './NotificationRepo';
import UserRepo from './UserRepo';

export default class ChatRepo {
  public static async findById(_id: string): Promise<IChatMessage | null> {
    const find = await ChatModel.findOne({ _id: new Types.ObjectId(_id) })
      .populate({
        path: 'sender',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      })
      .lean<IChatMessage>()
      .exec();

    return find;
  }

  public static async getMessages(
    order: IOrder,
    channel: ChatChannel,
  ): Promise<IChatMessage[] | null> {
    const find = await ChatModel.find({ order: order._id, channel })
      .populate({
        path: 'sender',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      })
      .lean<IChatMessage[]>()
      .exec();

    return find;
  }

  public static async getUnreadMessageCount(
    order: IOrder,
    channel: string,
  ): Promise<number> {
    const find = await ChatModel.find({
      order: order._id,
      channel,
      seen: false,
    })
      .lean<IChatMessage[]>()
      .exec();

    return find.length;
  }

  public static async readMessages(
    order: IOrder,
    user: IUser,
    channel: string,
  ): Promise<boolean> {
    const find = await ChatModel.find({ order: order._id })
      .populate({
        path: 'sender',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      })
      .lean<IChatMessage[]>()
      .exec();

    if (!find) return false;

    const unreadMessages: any = find.filter(
      (msg) =>
        msg.seen === false &&
        msg.sender &&
        msg.sender._id &&
        msg.sender._id.toString() !== user._id.toString() &&
        msg.channel === channel &&
        msg.system === false,
    );

    let i = 0;
    for (const msg of unreadMessages) {
      msg.seen = true;
      this.updateInfo(msg);
      i++;
      if (i === unreadMessages.length)
        io.server.to(order._id.toString() + '_' + channel).emit('message_seen');
    }

    return true;
  }

  public static async create(
    order: IOrder,
    message: IChatMessage,
  ): Promise<IChatMessage> {
    const now = new Date();
    message.createdAt = now;
    const createdMessage = await ChatModel.create(message);

    const find = await ChatModel.findOne({ _id: createdMessage._id })
      .populate({
        path: 'sender',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      })
      .lean<IChatMessage>()
      .exec();

    return find;
  }

  public static async createSystemMsg(order: IOrder, message: string) {
    const msg = {
      message,
      channel: 'general',
      order: order,
      system: true,
    } as unknown as IChatMessage;

    const createdMsg = await ChatRepo.create(order, msg);

    io.server.to(`${order._id.toString()}_general`).emit('new_chat_message', {
      channel: 'general',
      message: createdMsg,
    });
  }

  public static updateInfo(message: IChatMessage): Promise<IChatMessage> {
    return ChatModel.updateOne({ _id: message._id }, { $set: { ...message } })
      .lean<IChatMessage>()
      .exec();
  }

  public static async deleteMessage(order: IOrder, _id: Types.ObjectId) {
    return await ChatModel.deleteOne({
      _id: _id,
      order: order._id,
    });
  }

  public static async notify(
    roomName: string,
    order: IOrder,
    notify: 'booster' | 'customer',
  ) {
    // Connected socket ids
    const _socks = await io.server.to(roomName).fetchSockets();
    const sockets = _socks.map((socket) => socket.id);

    if (!order.customer || !order.booster) return false;

    const booster = await UserRepo.findById(order.booster._id);
    const customer = await UserRepo.findById(order.customer._id);

    if (!booster || !customer) return false;

    // Notify booster
    if (booster && notify === 'booster') {
      const boosterId = booster._id.toString();

      // Get booster connection
      const findBooster = __clients.filter(
        (client) => client.sub === boosterId,
      );

      // Connected
      if (findBooster.length > 0) {
        const chatConnection = sockets.includes(findBooster[0].id);
        if (!chatConnection)
          io.server.to(findBooster[0].id).emit(EventName.ShowNotification, {
            notification_id: randomUUID(),
            message: `New message: Order #${order.orderId}`,
          });
      }
      const notification = {
        user: booster,
        title: 'You have an unread message',
        description: `New message for order #${order.orderId}.`,
        redirectUrl: `/dashboard/order/${order.orderId}`,
        slug: `order_${order.orderId}_customer_message`,
      } as INotification;
      await NotificationRepo.create(notification);
    }

    // Notify customer
    if (customer && notify === 'customer') {
      const customerId = customer._id.toString();

      // Get customer connection
      const findCustomer = __clients.filter(
        (client) => client.sub === customerId,
      );

      // Connected
      if (findCustomer.length > 0) {
        const chatConnection = sockets.includes(findCustomer[0].id);
        if (!chatConnection)
          io.server.to(findCustomer[0].id).emit(EventName.ShowNotification, {
            notification_id: randomUUID(),
            message: `New message: Order #${order.orderId}.`,
          });
      }
      const notification = {
        user: customer,
        title: 'You have an unread message',
        description: `New message for order #${order.orderId}.`,
        redirectUrl: `/dashboard/order/${order.orderId}`,
        slug: `order_${order.orderId}_booster_message`,
      } as INotification;
      await NotificationRepo.create(notification);
    }
  }
}
