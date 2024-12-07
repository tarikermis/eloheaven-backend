import IService, { ServiceModel } from '@models/Service';
import IServiceFilter, {
  ServiceFilterModel,
} from '@database/models/ServiceFilter';

export default class ServiceRepo {
  public static find(service: string): Promise<IService> {
    return ServiceModel.findOne({
      service,
    })
      .lean<IService>()
      .exec();
  }

  public static findFilter(
    service: string,
    server: string,
  ): Promise<IServiceFilter> {
    return ServiceFilterModel.findOne({
      service,
      server: server.toUpperCase(),
    })
      .lean<IServiceFilter>()
      .exec();
  }

  public static findFilterWithoutServer(
    service: string,
  ): Promise<IServiceFilter> {
    return ServiceFilterModel.findOne({
      service,
    })
      .lean<IServiceFilter>()
      .exec();
  }

  public static getAllFilters(): Promise<IServiceFilter[]> {
    return ServiceFilterModel.find().lean<IServiceFilter[]>().exec();
  }

  public static async create(
    service: string,
    data: string[][],
  ): Promise<IService> {
    const now = new Date();
    const obj = await ServiceModel.create({
      service,
      data,
      createdAt: now,
      updatedAt: now,
    } as IService);
    return obj.toObject();
  }

  public static update(service: IService): Promise<any> {
    service.updatedAt = new Date();
    return ServiceModel.updateOne(
      { _id: service._id },
      { $set: { ...service } },
    )
      .lean()
      .exec();
  }
}
