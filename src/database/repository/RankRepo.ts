import { GameCode } from '@core/boost/Boost';
import IRank, { RankModel } from '@database/models/Rank';
import { Types } from 'mongoose';

export default class RankRepo {
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

    return RankModel.paginate(query, opt);
  }

  public static findByGame(game: string): Promise<IRank[] | null> {
    return RankModel.find({ game: game }).lean<IRank[]>().exec();
  }

  public static findById(id: Types.ObjectId): Promise<IRank | null> {
    return RankModel.findOne({ _id: id }).lean<IRank>().exec();
  }

  public static findByCode(
    game: GameCode,
    code: string,
  ): Promise<IRank | null> {
    return RankModel.findOne({ game, code }).lean<IRank>().exec();
  }

  public static async findByLp(game: GameCode, lp: number): Promise<IRank> {
    let closestLp = Math.round(lp / 50) * 50;

    if (lp < 0) closestLp = 0;
    if (closestLp < lp) closestLp += 50;

    const search = await RankModel.findOne({ game, lp: closestLp })
      .lean<IRank>()
      .exec();

    if (!search)
      return await RankModel.findOne({ game })
        .sort({ hierarchy: -1 }) // latest rank
        .lean<IRank>()
        .exec();
    else return search;
  }
}
