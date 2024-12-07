import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { IncreaseType } from '@common/Price';
import { ServiceCode } from '@core/boost/Boost';

export const DOCUMENT_NAME = 'Coupon';
export const COLLECTION_NAME = 'coupons';

export default interface ICoupon extends Document {
  code: string;
  discount: number;
  type: IncreaseType;
  scope: ServiceCode[];
  limit: number;
  status: boolean;
  autoApply: boolean;
  createdAt: Date;
  expireAt: Date;
}

const schema = new Schema(
  {
    code: {
      type: Schema.Types.String,
      required: true,
    },
    discount: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    type: {
      type: Schema.Types.String,
      enum: [IncreaseType.Percentage, IncreaseType.Direct],
      required: true,
    },
    scope: {
      type: [Schema.Types.String],
      required: true,
      enum: [
        ServiceCode.LeagueOfLegends_EloBoost,
        ServiceCode.LeagueOfLegends_DuoBoost,
        ServiceCode.LeagueOfLegends_Placement,
        ServiceCode.LeagueOfLegends_WinBoost,
        ServiceCode.LeagueOfLegends_Coaching,
        ServiceCode.Valorant_EloBoost,
        ServiceCode.Valorant_DuoBoost,
        ServiceCode.Valorant_Placement,
        ServiceCode.Valorant_WinBoost,
        ServiceCode.Valorant_Coaching,
        ServiceCode.TeamfightTactics_EloBoost,
        ServiceCode.TeamfightTactics_DuoBoost,
        ServiceCode.TeamfightTactics_Placement,
        ServiceCode.TeamfightTactics_WinBoost,
        ServiceCode.TeamfightTactics_Coaching,
        ServiceCode.WildRift_EloBoost,
        ServiceCode.WildRift_DuoBoost,
        ServiceCode.WildRift_Placement,
        ServiceCode.WildRift_WinBoost,
        ServiceCode.WildRift_Coaching,
      ],
    },
    limit: {
      type: Schema.Types.Number,
      default: 0,
    },
    status: {
      type: Schema.Types.Boolean,
      default: true,
    },
    autoApply: {
      type: Schema.Types.Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

schema.plugin(paginate);

export const CouponModel = model<ICoupon, PaginateModel<ICoupon>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
