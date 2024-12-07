import { Types } from 'mongoose';
import KeystoreRepo from './KeystoreRepo';
import IUser, { UserModel } from '@models/User';
import IRole, { RoleModel } from '@models/Role';
import IKeystore from '@models/Keystore';
import { BadRequestError, InternalError } from '@core/ApiError';
import Logger from '@core/Logger';
import RoleRepo from './RoleRepo';
import { PermissionCode } from '@common/Permission';
import { ITransaction, TransactionTag } from '@database/models/Transaction';
import TransactionRepo from './TransactionRepo';
import IOrder from '@database/models/Order';
import { safeFloat } from '@helpers/number';
import _ from 'lodash';

export default class UserRepo {
  public static paginate(
    query: object,
    options: {
      limit: number;
      page: number;
      select?: string;
      populate?: string;
      sort?: any;
    },
  ) {
    const opt = {
      limit: options.limit,
      page: options.page,
      select: options.select,
      populate: options.populate,
      sort: options.sort,
    };

    return UserModel.paginate(query, opt);
  }

  // contains critical information of the user
  public static findById(
    id: Types.ObjectId,
    populateBoosterDetails = false,
  ): Promise<IUser | null> {
    return UserModel.findOne({ _id: id })
      .select(
        '+email +password +role +boosterDetails +profile +documents +discordId',
      )
      .populate({
        path: 'role',
        match: { status: true },
      })
      .populate({
        path: 'boosterDetails',
        match: { boosterDetails: { $ne: undefined } },
        populate: populateBoosterDetails
          ? [
              {
                path: 'services',
                populate: [
                  {
                    path: 'filter',
                    select: { game: 1, title: 1, service: 1, server: 1 },
                  },
                  {
                    path: 'ranks',
                  },
                ],
              },
            ]
          : [],
      })
      .lean<IUser>()
      .exec();
  }
  public static updateMany(filter: object, update: object) {
    return UserModel.updateMany(filter, update);
  }
  public static findByUsername(username: string): Promise<IUser | null> {
    const escapedUsername = _.escapeRegExp(username);
    const pattern = new RegExp('^' + escapedUsername + '$', 'i');

    return UserModel.findOne({
      username: pattern,
    })
      .select('+email +password +role')
      .populate({
        path: 'role',
        match: { status: true },
        select: { code: 1 },
      })
      .lean<IUser>()
      .exec();
  }

  public static findByEmail(email: string): Promise<IUser | null> {
    const escapedEmail = _.escapeRegExp(email);
    const pattern = new RegExp('^' + escapedEmail + '$', 'i');

    return UserModel.findOne({ email: pattern })
      .select('+email +password +role +pwdResetToken +pwdResetTokenExpire')
      .populate({
        path: 'role',
        match: { status: true },
        select: { code: 1 },
      })
      .lean<IUser>()
      .exec();
  }

  public static findByDiscordId(discordId: string): Promise<IUser | null> {
    return UserModel.findOne({ discordId: discordId })
      .select('+email +password +role +discordId')
      .populate({
        path: 'role',
        match: { status: true },
        select: { code: 1 },
      })
      .lean<IUser>()
      .exec();
  }
  public static findProfileById(id: Types.ObjectId): Promise<IUser | null> {
    return UserModel.findOne({ _id: id, status: true })
      .select('+role +discordId')
      .populate({
        path: 'role',
        match: { status: true },
        select: { code: 1 },
      })
      .lean<IUser>()
      .exec();
  }

  public static findPublicProfile(
    search: string,
    by: 'id' | 'username',
  ): Promise<IUser | null> {
    return UserModel.findOne(
      by === 'id'
        ? { _id: search, status: true }
        : { username: search, status: true },
    )
      .select('+role +appear +profile')
      .lean<IUser>()
      .exec();
  }

  public static findByResetPwdToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({ pwdResetToken: token })
      .select(
        '+email +password +role +boosterDetails +profile +documents +pwdResetToken +pwdResetTokenExpire',
      )
      .lean<IUser>()
      .exec();
  }

  public static async create(
    user: IUser,
    accessTokenKey: string,
    refreshTokenKey: string,
    roleCode: string,
  ): Promise<{ user: IUser; keystore: IKeystore }> {
    const now = new Date();

    const role = await RoleModel.findOne({ code: roleCode })
      .select('+email +password')
      .lean<IRole>()
      .exec();
    if (!role) {
      Logger.error('@repository/UserRepo.ts -> Role must be defined');
      throw new InternalError();
    }

    user.role = role._id;
    user.email = user.email?.toLowerCase();
    user.createdAt = user.updatedAt = user.lastLoginAt = now;

    const createdUser = await UserModel.create(user);
    const keystore = await KeystoreRepo.create(
      createdUser._id,
      accessTokenKey,
      refreshTokenKey,
    );
    return { user: createdUser.toObject(), keystore: keystore };
  }

  public static async update(
    user: IUser,
    accessTokenKey: string,
    refreshTokenKey: string,
  ): Promise<{ user: IUser; keystore: IKeystore }> {
    user.updatedAt = new Date();
    await UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
      .lean()
      .exec();
    const keystore = await KeystoreRepo.create(
      user._id,
      accessTokenKey,
      refreshTokenKey,
    );
    return { user: user, keystore: keystore };
  }

  public static async updateInfo(user: IUser): Promise<any> {
    user.updatedAt = new Date();
    return UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
      .lean()
      .exec();
  }

  public static async updateBalance(
    type: 'AddBalance' | 'SubtractBalance',
    user: IUser,
    amount: number,
    description?: string,
    tag?: string,
    issuer?: IUser,
  ): Promise<any> {
    const multiplier = type === 'AddBalance' ? 1 : -1;
    const _amount = Number(amount);
    const logAmount = _amount * multiplier;

    switch (type) {
      case 'AddBalance':
        user.balance += _amount;
        break;
      case 'SubtractBalance':
        user.balance -= _amount;
        break;
    }
    user.updatedAt = new Date();

    if (!description) description = 'Unknown';
    if (!tag) tag = TransactionTag.Normal;

    const object = {
      user: user,
      amount: logAmount,
      description: description,
      tag: tag,
      createdAt: new Date(),
    } as ITransaction;

    if (issuer) object.issuer = issuer._id;

    await TransactionRepo.create(object);

    return UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
      .lean()
      .exec();
  }
  public static async isBooster(user: IUser): Promise<boolean> {
    const role = await RoleRepo.findById(user.role._id);
    if (
      role &&
      role.permissions.includes(PermissionCode.Booster) &&
      user.boosterDetails
    ) {
      return true;
    }
    return false;
  }

  public static calculateBoosterPrice(booster: IUser, order: IOrder): number {
    if (!order.filter) return 0;
    if (!booster.boosterDetails) return 0;
    const ofilter = order.filter._id.toString();
    const findService = booster.boosterDetails.services.filter(
      (f) => f.filter._id.toString() === ofilter,
    );

    const ranksMap = findService[0].ranks.map((rank) => rank._id.toString());

    const commission = findService[0].commission;

    if (order.details && order.details.general) {
      // Check via target league
      if (order.details.general.target && order.details.general.target.rank) {
        const rid = order.details.general.target.rank._id.toString();
        if (!ranksMap.includes(rid)) return 0;
      }
    }

    return safeFloat((order.totalPrice / 100) * commission);
  }

  public static async getStats(): Promise<any> {
    const roles = await RoleRepo.paginate(
      {},
      {
        limit: 100,
        page: 1,
      },
    );
    const map: any = {};
    for (const rl of roles.docs) {
      const count = await UserModel.countDocuments({ role: rl._id });
      map[rl.code] = count;
    }

    const guests = await UserModel.countDocuments({
      username: { $regex: 'guest_' },
    });
    map['guest'] = guests;

    const banneds = await UserModel.countDocuments({ status: false });
    map['banned'] = banneds;
    map['gclid'] = await UserModel.countDocuments({
      gclid: { $ne: undefined },
    });
    map['cookie_accepted'] = await UserModel.countDocuments({
      consent: { $eq: true },
    });
    map['cookie_declined'] = await UserModel.countDocuments({
      consent: { $eq: false },
    });
    return map;
  }
}
