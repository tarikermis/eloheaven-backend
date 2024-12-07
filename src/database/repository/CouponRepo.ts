import { OrderModel, OrderState } from '@database/models/Order';
import ICoupon, { CouponModel } from '@models/Coupon';

import _ from 'lodash';
import { Types } from 'mongoose';

export default class CouponRepo {
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

    return CouponModel.paginate(query, opt);
  }

  public static async findAll(): Promise<ICoupon[] | null> {
    const find = await CouponModel.find().lean<ICoupon[]>().exec();
    return find;
  }

  public static async findByIdAdmin(
    _id: Types.ObjectId,
  ): Promise<ICoupon | null> {
    const now = new Date();
    const find = await CouponModel.findOne({ _id }).lean<ICoupon>().exec();

    return find;
  }

  public static async findById(_id: Types.ObjectId): Promise<ICoupon | null> {
    const now = new Date();
    const find = await CouponModel.findOne({ _id, status: true })
      .lean<ICoupon>()
      .exec();

    if (!find || find.limit <= 0 || find.status === false) return null;
    if (now > find.expireAt) return null;
    return find;
  }

  public static async findByCode(code: string): Promise<ICoupon | null> {
    const escapedCode = _.escapeRegExp(code);
    const pattern = new RegExp('^' + escapedCode + '$', 'i');

    const now = new Date();
    const find = await CouponModel.findOne({ code: pattern, status: true })
      .lean<ICoupon>()
      .exec();

    if (!find || find.limit <= 0 || find.status === false) return null;
    if (now > find.expireAt) return null;
    return find;
  }

  public static async create(coupon: ICoupon): Promise<ICoupon> {
    const now = new Date();
    coupon.createdAt = now;
    if (coupon.expireAt === undefined) coupon.expireAt = new Date(2038, 1, 1);
    const createdCoupon = await CouponModel.create(coupon);
    return createdCoupon.toObject();
  }

  public static async getTotalSum(coupon: ICoupon): Promise<any> {
    const aggr = await OrderModel.aggregate([
      {
        $match: {
          coupon: new Types.ObjectId(coupon._id),
          state: {
            $nin: [OrderState.NotPaid, OrderState.Cancelled],
          },
        },
      },
      {
        $group: {
          _id: 'null',
          total: {
            $sum: '$totalPrice',
          },
        },
      },
    ]);

    return aggr.length > 0 ? aggr[0].total : 0;
  }

  public static updateInfo(coupon: ICoupon): Promise<any> {
    return CouponModel.updateOne({ _id: coupon._id }, { $set: { ...coupon } })
      .lean()
      .exec();
  }

  public static delete(_id: string): Promise<any> {
    return CouponModel.deleteOne({ _id }).exec();
  }
}
