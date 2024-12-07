import IRole, { RoleModel } from '@models/Role';
import { Types } from 'mongoose';

export default class RoleRepo {
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

    return RoleModel.paginate(query, opt);
  }

  public static findByCode(code: string): Promise<IRole | null> {
    return RoleModel.findOne({ code: code, status: true }).lean<IRole>().exec();
  }

  public static findById(id: Types.ObjectId): Promise<IRole | null> {
    return RoleModel.findOne({ _id: id, status: true }).lean<IRole>().exec();
  }
}
