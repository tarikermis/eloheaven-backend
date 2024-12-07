import { getGeoInfo } from '@common/GeoConfig';
import IGeoCache, { GeoCacheModel } from '@database/models/GeoCache';

export default class GeoCacheRepo {
  public static async init(ipAddress: string): Promise<{
    data: IGeoCache;
    from: 'cache' | 'fresh';
  } | null> {
    const find = await GeoCacheModel.findOne({ ipAddress: ipAddress })
      .lean<IGeoCache>()
      .exec();

    const now = new Date();
    const fiveAgo = new Date(now.setDate(now.getDate() - 5));
    if (!find || find.updatedAt < fiveAgo) {
      const getInfo = await getGeoInfo(ipAddress);
      if (!!getInfo) {
        const now = new Date();
        // create
        if (!find) {
          const obj = {
            ipAddress: ipAddress,
            countryCode: getInfo.countryCode,
            latitude: getInfo.lat,
            longitude: getInfo.lon,
            timezone: getInfo.timezone,
            isp: getInfo.isp,
            createdAt: now,
            updatedAt: now,
          } as IGeoCache;
          const createdObj = await GeoCacheModel.create(obj);
          return { data: createdObj.toObject(), from: 'fresh' };
        }
        // update
        else {
          find.ipAddress = ipAddress;
          find.countryCode = getInfo.countryCode;
          find.latitude = getInfo.lat;
          find.longitude = getInfo.lon;
          find.timezone = getInfo.timezone;
          find.isp = getInfo.isp;
          find.updatedAt = now;
          this.updateInfo(find);
          return {
            data: find,
            from: 'fresh',
          };
        }
      } else return null;
    }

    return {
      data: find,
      from: 'cache',
    };
  }

  public static updateInfo(geoCache: IGeoCache): Promise<any> {
    return GeoCacheModel.updateOne(
      { ipAddress: geoCache.ipAddress },
      { $set: { ...geoCache } },
    )
      .lean()
      .exec();
  }

  public static async create(geoCache: IGeoCache): Promise<IGeoCache> {
    const now = new Date();
    geoCache.updatedAt = now;
    const createdRate = await GeoCacheModel.create(geoCache);
    return createdRate;
  }
}
