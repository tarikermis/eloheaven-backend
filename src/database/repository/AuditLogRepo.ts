import IUser from '@models/User';
import IAuditLog, { AuditLogModel, LogScope } from '@models/AuditLog';
import { Types } from 'mongoose';

export default class AuditLogRepo {
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

    return AuditLogModel.paginate(query, opt);
  }

  public static async insert(
    message: string,
    scope: LogScope,
    user?: IUser,
  ): Promise<IAuditLog> {
    const now = new Date();
    const auditLog = await AuditLogModel.create({
      user: user,
      message,
      scope,
      createdAt: now,
    } as IAuditLog);
    return auditLog.toObject();
  }

  public static async create(log: IAuditLog): Promise<IAuditLog> {
    const now = new Date();
    log.createdAt = now;
    const createdLog = await AuditLogModel.create(log);
    return createdLog.toObject();
  }

  public static async findByUser(
    id: Types.ObjectId,
  ): Promise<IAuditLog[] | null> {
    const logs = await AuditLogModel.find({ user: id });
    return logs;
  }
}
