import { Types } from 'mongoose';
import INotification, {
  NotificationModel,
} from '@database/models/Notification';
import IUser from '@database/models/User';
import UserRepo from './UserRepo';
import { sendChannelMessage } from '@core/discord/utils/dmUtils';
import { baseDomain } from '@config';

export default class NotificationRepo {
  public static paginate(
    query: object,
    options: {
      limit: number;
      page: number;
      select?: string;
      populate?: any;
    },
  ) {
    const opt = {
      limit: options.limit,
      page: options.page,
      select: options.select,
      populate: options.populate,
      sort: [['_id', 'desc']],
    };

    return NotificationModel.paginate(query, opt);
  }

  public static findById(id: string): Promise<INotification | null> {
    return NotificationModel.findOne({ _id: new Types.ObjectId(id) })
      .lean<INotification>()
      .exec();
  }

  public static findByUser(user: IUser): Promise<INotification[] | null> {
    return NotificationModel.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<INotification[]>()
      .exec();
  }

  public static async create(notification: INotification) {
    const now = new Date();
    notification.createdAt = now;
    const createdNotification = await NotificationModel.create(notification);

    const bst = await UserRepo.findById(notification.user._id);
    if (bst && bst.discordId) {
      const guildId = '775847108078731275';
      let channelName = `${createdNotification._id}`;

      // Check if redirectUrl exists and extract orderId
      if (notification.redirectUrl) {
        const urlParts = notification.redirectUrl.split('/');
        const orderId = urlParts[urlParts.length - 1]; // Get the last part of the URL
        channelName = `${orderId}`;
        const messageContent = `📢 <@${bst.discordId}> ${
          notification.description
        } ${
          notification.redirectUrl
            ? 'Details: ' + baseDomain + notification.redirectUrl
            : ''
        }`;
        // Pass bst.discordId as the userId to sendChannelMessage
        await sendChannelMessage(
          guildId,
          channelName,
          messageContent,
          bst.discordId,
          orderId,
        );
      }
    }

    return createdNotification;
  }

  public static delete(
    notification: INotification,
  ): Promise<INotification | null> {
    return NotificationModel.deleteOne({ _id: notification._id })
      .lean<INotification>()
      .exec();
  }

  public static updateInfo(
    notification: INotification,
  ): Promise<INotification> {
    const now = new Date();
    return NotificationModel.updateOne(
      { _id: notification._id },
      { $set: { ...notification } },
    )
      .lean<INotification>()
      .exec();
  }
}
