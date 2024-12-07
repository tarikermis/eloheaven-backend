import { Types } from 'mongoose';
import IOrder, { OrderModel, OrderState } from '@database/models/Order';
import IUser from '@database/models/User';
import UserRepo from './UserRepo';
import { ApiMessage } from '@common/ApiMessage';
import { BadRequestError } from '@core/ApiError';
import { PermissionCode } from '@common/Permission';
import AuditLogRepo from './AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import { io, __clients } from '../../server';
import { EventName } from '@common/EventName';
import INotification from '../models/Notification';
import NotificationRepo from './NotificationRepo';
import {
  baseColor,
  baseDomain,
  emojiList,
  notificationCooldown,
} from '@config';
import { randomUUID } from 'crypto';
import { TransactionTag } from '@database/models/Transaction';
import SystemRepo from './SystemRepo';
import { realValue, safeFloat } from '@helpers/number';
import ChatRepo from './ChatRepo';
import { sendMailRich } from '@core/integration/mail/Nodemailer';
import { readFileSync } from 'fs';
import path from 'path';
import { sendMessageWithEmbed } from '@core/discord/utils/channelUtils';

export default class OrderRepo {
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

    return OrderModel.paginate(query, opt);
  }

  public static findById(
    id: Types.ObjectId,
    select = '+coupon +booster +customer +photos',
  ): Promise<IOrder | null> {
    return OrderModel.findOne({ _id: id })
      .select(select)
      .populate([
        {
          path: 'booster',
          select: { _id: 1, username: 1, createdAt: 1 },
        },
        {
          path: 'customer',
          select: { _id: 1, username: 1, createdAt: 1 },
        },
      ])
      .lean<IOrder>()
      .exec();
  }

  public static findByNum(
    id: number,
    select = '+coupon +booster +customer +photos',
  ): Promise<IOrder | null> {
    return OrderModel.findOne({ orderId: id })
      .select(select)
      .populate([
        {
          path: 'booster',
          select: { _id: 1, username: 1, createdAt: 1 },
        },
        {
          path: 'customer',
          select: { _id: 1, username: 1, createdAt: 1 },
        },
      ])
      .lean<IOrder>()
      .exec();
  }

  public static findByBooster(id: Types.ObjectId): Promise<IOrder[] | null> {
    return OrderModel.find({ booster: id }).lean<IOrder[]>().exec();
  }

  public static findByCustomer(id: Types.ObjectId): Promise<IOrder[] | null> {
    return OrderModel.find({ customer: id }).lean<IOrder[]>().exec();
  }

  public static async findAccountByHash(hash: string): Promise<boolean> {
    const ords = await OrderModel.find({ 'credentials.hash': hash })
      .lean<IOrder[]>()
      .exec();

    return ords.length > 0 ? true : false;
  }

  public static async create(
    order: IOrder,
    sendSystemMsg = true,
  ): Promise<IOrder> {
    const now = new Date();
    order.createdAt = order.updatedAt = now;
    const createdOrder = await OrderModel.create(order);

    await ChatRepo.createSystemMsg(
      createdOrder,
      "Please note that your cashback will be credited to your account once your payment for the service goes through. If you don't see your cashback immediately after payment, simply refresh the page. We appreciate your business!",
    );

    await ChatRepo.createSystemMsg(
      createdOrder,
      "VIP Booster Priority: Your order is reserved for VIP boosters for 45 seconds for top-tier service. Afterwards, it's available to our broader expert team for prompt handling.",
    );

    await ChatRepo.createSystemMsg(
      createdOrder,
      order.details.general.duoOrder
        ? 'Friendly Reminder: Please be advised that playing ranked matches without presence of the booster during an active boosting service is prohibited.'
        : 'Friendly Reminder: Please be advised that playing ranked matches during an active boosting service is prohibited.',
    );

    return createdOrder.toObject();
  }
  public static updateFlag(order: IOrder): Promise<IOrder> {
    order.flagTime = new Date();
    order.DeletionFlag = true;
    return OrderModel.updateOne({ _id: order._id }, { $set: { ...order } })
      .lean<IOrder>()
      .exec();
  }

  public static updateInfo(order: IOrder): Promise<IOrder> {
    order.updatedAt = new Date();
    return OrderModel.updateOne({ _id: order._id }, { $set: { ...order } })
      .lean<IOrder>()
      .exec();
  }

  public static deleteEmbed(_id: Types.ObjectId) {
    return OrderModel.updateOne({ _id }, { $unset: { embed: 1 } })
      .lean<IOrder>()
      .exec();
  }

  public static deleteBooster(_id: Types.ObjectId) {
    return OrderModel.updateOne({ _id }, { $unset: { booster: 1 } })
      .lean<IOrder>()
      .exec();
  }

  public static deletePhotos(_id: Types.ObjectId) {
    return OrderModel.updateOne({ _id }, { $unset: { photos: 1 } })
      .lean<IOrder>()
      .exec();
  }

  public static async claimBoost(
    currentUser: IUser,
    order: IOrder,
  ): Promise<boolean> {
    if (!UserRepo.isBooster(currentUser))
      throw new BadRequestError(ApiMessage.UserNotBooster);

    if (!currentUser.documents || currentUser.documents.length === 0)
      throw new BadRequestError(ApiMessage.DocumentVerificationRequired);

    if (order.state !== OrderState.WaitingForBooster)
      throw new BadRequestError(ApiMessage.OrderNotFound);

    const claimedBoosts = await this.findByBooster(currentUser._id);

    if (!claimedBoosts) throw new BadRequestError(ApiMessage.SomethingWrong);

    const claimedSoloOrderCount = claimedBoosts
      .map(
        (x) =>
          x.details.general.duoOrder == false &&
          x.state === OrderState.Boosting,
      )
      .filter((x) => x === true).length;

    const claimedDuoOrderCount = claimedBoosts
      .map(
        (x) =>
          x.details.general.duoOrder == true && x.state === OrderState.Boosting,
      )
      .filter((x) => x === true).length;

    if (!currentUser.boosterDetails) {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }

    if (!currentUser.boosterDetails.services)
      throw new BadRequestError(ApiMessage.BoosterDetailsNotConfiguredYet);

    if (!order.filter || order.filter === undefined) {
      throw new BadRequestError(ApiMessage.ServiceFilterNotFound);
    }

    const searchService = currentUser.boosterDetails.services.filter((x) => {
      return x.filter.equals(order.filter?._id);
    });

    if (!searchService || searchService.length === 0) {
      throw new BadRequestError(ApiMessage.ServiceNotFoundOnBoosterDetails);
    }

    const boosterRanks = searchService[0].ranks.map((x) => x._id.toString());

    //? If target object is assigned, compare boosterConfig.ranks with target.rank
    //? If boosterConfig.ranks.includes target.rank: Booster can claim this order.
    //? Otherwise, he will claim directly because the order doesnt have any target details to check.

    //? EDIT: Current league check is added cuz boosters can claim win boosts etc.
    if (order.details.general.target && order.details.general.target.rank) {
      const check = boosterRanks.includes(
        order.details.general.target.rank._id.toString(),
      );
      if (!check) {
        throw new BadRequestError(
          ApiMessage.NotEligibleToClaimThisLeagueOrders,
        );
      }
    } else {
      if (order.details.general.current && order.details.general.current.rank) {
        const check = boosterRanks.includes(
          order.details.general.current.rank._id.toString(),
        );
        if (!check) {
          throw new BadRequestError(
            ApiMessage.NotEligibleToClaimThisLeagueOrders,
          );
        }
      }
    }

    //? Check is booster eligible to claim this order (by claimed order count)
    if (order.details.general.duoOrder === true) {
      // Duo orders
      if (claimedDuoOrderCount >= currentUser.boosterDetails.duoClaimLimit)
        throw new BadRequestError(ApiMessage.DuoOrderClaimLimitReached);
    } else {
      // Solo orders
      if (claimedSoloOrderCount >= currentUser.boosterDetails.soloClaimLimit)
        throw new BadRequestError(ApiMessage.SoloOrderClaimLimitReached);
    }

    const findCustomer = __clients.filter((client) =>
      order.customer ? order.customer._id.toString() === client.sub : false,
    );

    if (findCustomer.length > 0) {
      io.server.to(findCustomer[0].id).emit(EventName.ShowNotification, {
        notification_id: randomUUID(),
        message: `Order #${order.orderId} claimed by ${currentUser.username}`,
      });
    }

    order.state = OrderState.Boosting;
    order.booster = currentUser;
    OrderRepo.updateInfo(order);

    const notification = {
      user: order.customer,
      title: 'Your order claimed by booster',
      description: `Order #${order.orderId} claimed by ${currentUser.username}.`,
      redirectUrl: `/dashboard/order/${order.orderId}`,
      slug: `order_${order.orderId}_claimed`,
    } as INotification;

    await NotificationRepo.create(notification);

    await ChatRepo.createSystemMsg(
      order,
      `Your order has been claimed by ${currentUser.username}`,
    );

    await AuditLogRepo.insert(
      `Order #${order.orderId} claimed.`,
      LogScope.Order,
      currentUser,
    );

    return true;
  }

  public static async finishBoost(
    booster: IUser,
    order: IOrder,
  ): Promise<boolean> {
    if (!OrderRepo.isBooster(order, booster))
      throw new BadRequestError(ApiMessage.AccessDenied);

    if (order.state !== OrderState.VerificationRequired)
      throw new BadRequestError(ApiMessage.AccessDenied);

    if (!booster.boosterDetails) {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }

    if (!booster.boosterDetails.services)
      throw new BadRequestError(ApiMessage.BoosterDetailsNotConfiguredYet);

    if (!order.filter || order.filter === undefined) {
      throw new BadRequestError(ApiMessage.ServiceFilterNotFound);
    }

    const searchService = booster.boosterDetails.services.filter((x) => {
      return x.filter.equals(order.filter?._id);
    });

    if (!searchService || searchService.length === 0) {
      throw new BadRequestError(ApiMessage.ServiceNotFoundOnBoosterDetails);
    }

    const boostPay = safeFloat(
      (order.totalPrice / 100) * searchService[0].commission,
    );

    order.state = OrderState.Completed;
    order.boosterPrice = boostPay;
    OrderRepo.updateInfo(order);

    await UserRepo.updateBalance(
      'AddBalance',
      booster,
      boostPay,
      `Order #${order.orderId} completed.`,
      TransactionTag.BoostPay,
    );

    const findBooster = __clients.filter((client) =>
      order.booster ? order.booster._id.toString() === client.sub : false,
    );

    if (findBooster.length > 0) {
      io.server.to(findBooster[0].id).emit(EventName.ShowNotification, {
        notification_id: randomUUID(),
        message: `Order #${order.orderId} verified by admin.`,
      });
    }

    const notification = {
      user: order.booster,
      title: 'Order completed!',
      description: `Order #${order.orderId} verified by admin.`,
      redirectUrl: `/dashboard/order/${order.orderId}`,
      slug: `order_${order.orderId}_claimed`,
    } as INotification;

    await NotificationRepo.create(notification);

    await ChatRepo.createSystemMsg(order, 'Your order has been completed.');

    await AuditLogRepo.insert(
      `Order #${order.orderId} completed.`,
      LogScope.Order,
      booster,
    );

    return true;
  }

  public static isCustomer = (order: IOrder, user: IUser) =>
    order.customer && order.customer._id.toString() === user._id.toString();

  public static isBooster = (order: IOrder, user: IUser) =>
    order.booster && order.booster._id.toString() === user._id.toString();

  public static isAdmin = (user: IUser) =>
    user.role.permissions.includes(PermissionCode.EditOrders) ||
    user.role.permissions.includes(PermissionCode.FullAccess);

  public static closeAllOrders(
    user: IUser,
    state: OrderState,
    excludeOrder?: IOrder,
  ): Promise<IOrder> {
    // Cancel all not_paid orders
    const query: any = {};

    if (excludeOrder) {
      query['_id'] = { $ne: excludeOrder._id };
    }

    query['customer'] = user._id;
    query['state'] = state;

    const options = {
      limit: 100000,
      page: 1,
    };

    return OrderModel.updateMany(query, {
      $set: { state: OrderState.Cancelled },
    })
      .lean<IOrder>()
      .exec();
  }

  public static async notifyBoosters(order: IOrder) {
    let roleToPing: any = null;
    let vipChannel: any = null;
    let normalChannel: any = null;
    // available for boosters
    if (!order.booster && order.state === OrderState.WaitingForBooster) {
      if (order.embed) {
        const settings = await SystemRepo.getSettings();
        const game = order.service?.split('_')[0];

        const emojis = emojiList as any;
        switch (game) {
          case 'lol':
            vipChannel = settings.lolVipNotificationChannel;
            normalChannel = settings.lolNotificationChannel;
            roleToPing = `<@&${settings.lolBoostersRoleId}>`;
            break;
          case 'val':
            vipChannel = settings.valVipNotificationChannel;
            normalChannel = settings.valNotificationChannel;
            roleToPing = `<@&${settings.valBoostersRoleId}>`;
            break;
          case 'tft':
            vipChannel = settings.tftVipNotificationChannel;
            normalChannel = settings.tftNotificationChannel;
            roleToPing = `<@&${settings.tftBoostersRoleId}>`;
            break;
          case 'wr':
            vipChannel = settings.wrVipNotificationChannel;
            normalChannel = settings.wrNotificationChannel;
            roleToPing = `<@&${settings.wrBoostersRoleId}>`;
            break;
        }
        //? prepare fields
        if (order.embed.fields) {
          //? Extra options
          const extras = order.details.extras;
          if (
            extras &&
            (extras.priorityOrder ||
              extras.duoBoost ||
              extras.extraWin ||
              extras.streamGames ||
              extras.appearOffline ||
              extras.soloOnly ||
              extras.vpnOn ||
              extras.noStack ||
              extras.premiumDuoBoost ||
              extras.ghostBoost ||
              extras.normalizeScore ||
              extras.lowLpGain)
          ) {
            order.embed.fields.push({
              name: 'Extras',
              value: `${extras.priorityOrder ? '✅ Priority Order\n' : ''}${
                extras.duoBoost ? '✅ Duo Boost\n' : ''
              }${extras.extraWin ? '✅ Extra Win\n' : ''}${
                extras.streamGames ? '✅ Stream Games\n' : ''
              }${extras.appearOffline ? '✅ Appear Offline\n' : ''}${
                extras.soloOnly ? '✅ Solo Only\n' : ''
              }${extras.vpnOn ? '✅ VPN On\n' : ''}${
                extras.noStack ? '✅ No 5 Stack\n' : ''
              }${extras.premiumDuoBoost ? '✅ Premium Duo Boost\n' : ''}
              ${extras.normalizeScore ? '✅ Normalize Score\n' : ''}
              ${extras.ghostBoost ? '✅ Ghost Boosting\n' : ''}`,
            });
          }

          //? Custom Lanes
          if (extras && extras.customLanes) {
            const primary = 'lane' + extras.customLanes.primary;
            const secondary = 'lane' + extras.customLanes.secondary;
            order.embed.fields.push({
              name: 'Custom Lanes',
              value: `${
                primary.length > 5 ? `Primary: ${emojis[primary]}\n` : ''
              }${
                secondary.length > 5 ? `Secondary: ${emojis[secondary]}\n` : ''
              }`,
            });
          }

          //? Custom Flash
          if (extras && extras.customFlash) {
            order.embed.fields.push({
              name: `Flash Key`,
              value: `${
                emojis['spellflash']
              } ${extras.customFlash.toUpperCase()}`,
            });
          }

          //? Champions
          if (extras && extras.customChampions) {
            const maxChamp = 10;
            const champs = extras.customChampions;
            order.embed.fields.push({
              name: 'Champions & Agents',
              value: `${champs.slice(0, maxChamp).join(', ')}${
                champs.length > maxChamp
                  ? ` and ${champs.length - maxChamp} more..`
                  : ''
              }`,
            });
          }

          order.embed.fields.push({
            name: '➡️ More Details',
            value: `[Click here to view](${baseDomain}/dashboard/booster/available-orders)`,
          });
        }

        order.embed.thumbnail = { url: `${baseDomain}/img/logo.png` };
        order.embed.color = parseInt(baseColor.replace('#', ''), 16);
      }

      // notify vip boosters
      io.server.to('vip_boosters').emit(EventName.NewBoostOrder, {
        special_sound: true,
        filter: order.filter,
        order_id: order._id,
      });

      // skip sending embed to vip channel
      if (parseInt(notificationCooldown.toString()) > 0) {
        sendMessageWithEmbed(vipChannel, roleToPing, order.embed);
      }
      const tempEmbed = order.embed;

      // notify normal boosters
      setTimeout(
        () => {
          io.server.to('normal_boosters').emit(EventName.NewBoostOrder, {
            special_sound: true,
            filter: order.filter,
            order_id: order._id,
          });
          sendMessageWithEmbed(normalChannel, roleToPing, tempEmbed);
        },
        parseInt(notificationCooldown.toString()) > 0
          ? parseInt(notificationCooldown.toString()) * 1000
          : 1, // 1ms
      );

      //! delete embed
      await OrderRepo.deleteEmbed(order._id);
    }

    if (order.booster && order.state === OrderState.Boosting) {
      const findBooster = __clients.filter(
        (client) => client.sub === order.booster?._id.toString(),
      );

      if (findBooster.length > 0) {
        io.server.to(findBooster[0].id).emit(EventName.NewBoostOrder, {
          special_sound: true,
          filter: order.filter,
          special: true,
          order_id: order._id,
        });
      }

      const notification = {
        user: order.booster,
        title: 'You have been assigned to order!',
        description: `You have been assigned to order #${order.orderId}.`,
        redirectUrl: `/dashboard/order/${order.orderId}`,
        slug: `order_${order.orderId}_assigned_by_customer`,
      } as INotification;
      await NotificationRepo.create(notification);
    }
  }

  public static getNextState(order: IOrder): OrderState {
    // coaching orders will start with boosting state
    if (order.details.general.sessionTime) return OrderState.Boosting;

    if (order.details.general.duoOrder) {
      if (order.booster) return OrderState.Boosting;
      else return OrderState.WaitingForBooster;
    } else {
      return OrderState.WaitingForAccount;
    }
  }

  public static async getStats(): Promise<any> {
    const states: any = Object.values(OrderState);
    const map: any = {};
    for (const st of states) {
      const count = await OrderModel.countDocuments({ state: st });
      map[st] = count;
    }
    const allOrders = await OrderModel.countDocuments({});
    map['all_orders'] = allOrders;
    return map;
  }

  public static async mailForCreatedOrder(order: IOrder): Promise<any> {
    if (!order.customer || !order.orderId || !order.totalPrice) return;

    const user = await UserRepo.findById(order.customer._id);

    if (!user) return;

    let template = readFileSync(
      path.join(
        __dirname + '../../../../src/data/templates/order-created.html',
      ),
      'utf-8',
    );

    template = template.replace('{{username}}', user.username ?? 'User');
    template = template.replace(
      '{{track_order_link}}',
      `${baseDomain}/dashboard/order/${order.orderId}`,
    );
    template = template.replace('{{order_id}}', order.orderId.toString());
    template = template.replace('{{order_title}}', order.title ?? 'unknown');
    template = template.replaceAll(
      '{{order_price}}',
      realValue(order.totalPrice).toString(),
    );

    sendMailRich(
      user.email,
      'Your order has been created!',
      template,
      [],
      [
        {
          filename: 'facebook.png',
          path: path.join(
            __dirname + '../../../../src/data/templates/images/facebook.png',
          ),
          cid: 'facebook',
        },
        {
          filename: 'twitter.png',
          path: path.join(
            __dirname + '../../../../src/data/templates/images/twitter.png',
          ),
          cid: 'twitter',
        },
        {
          filename: 'instagram.png',
          path: path.join(
            __dirname + '../../../../src/data/templates/images/instagram.png',
          ),
          cid: 'instagram',
        },
        {
          filename: 'logo.png',
          path: path.join(
            __dirname + '../../../../src/data/templates/images/logo.png',
          ),
          cid: 'logo',
        },
      ],
    );
  }
}
