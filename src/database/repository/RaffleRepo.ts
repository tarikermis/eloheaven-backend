import IRaffle, { RaffleModel } from '@database/models/Raffle';

import moment from 'moment';
import { Types } from 'mongoose';

export default class RaffleRepo {
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
    };

    return RaffleModel.paginate(query, opt);
  }

  public static async findAll(): Promise<IRaffle[] | null> {
    const find = await RaffleModel.find().lean<IRaffle[]>().exec();
    return find;
  }

  public static async findById(_id: Types.ObjectId): Promise<IRaffle | null> {
    const now = new Date();
    const find = await RaffleModel.findOne({ _id, status: true })
      .lean<IRaffle>()
      .exec();

    if (!find || find.status === false) return null;
    if (now > find.endTime) return null;
    return find;
  }

  public static async findByGuid(guid: string): Promise<IRaffle | null> {
    const now = new Date();
    const find = await RaffleModel.findOne({ guid, status: true })
      .lean<IRaffle>()
      .exec();

    if (!find || find.status === false) return null;
    if (now > find.endTime) return null;
    return find;
  }

  public static async findBySlug(slug: string): Promise<IRaffle | null> {
    const now = new Date();
    const find = await RaffleModel.findOne({ slug, status: true })
      .lean<IRaffle>()
      .exec();

    if (!find || find.status === false) return null;
    if (now > find.endTime) return null;
    return find;
  }

  public static async findLastActive(): Promise<IRaffle | null> {
    const lastActiveRaffle = await RaffleModel.findOne({ status: true })
      .lean<IRaffle>()
      .exec();
    if (!lastActiveRaffle) return null;
    return lastActiveRaffle;
  }

  public static async create(raffle: IRaffle): Promise<IRaffle> {
    const now = new Date();
    raffle.startTime = now;
    if (raffle.endTime === undefined)
      raffle.endTime = moment().add(7, 'days').toDate();
    const createdRaffle = await RaffleModel.create(raffle);
    return createdRaffle.toObject();
  }

  public static updateInfo(raffle: IRaffle): Promise<any> {
    return RaffleModel.updateOne({ _id: raffle._id }, { $set: { ...raffle } })
      .lean()
      .exec();
  }

  public static delete(_id: string): Promise<any> {
    return RaffleModel.deleteOne({ _id }).exec();
  }
}
