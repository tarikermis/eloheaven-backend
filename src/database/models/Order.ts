import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { IOrderDetails } from '@common/Order';
import ICoupon from './Coupon';

import { IOrderBonus, OrderBonusSchema } from './references/order/OrderBonus';
import { OrderDetailsSchema } from './references/order/OrderDetails';
import IServiceFilter from './ServiceFilter';
import IUser from './User';
import { GameCode, ServiceCode } from '@core/boost/Boost';
import { AutoIncrement } from '..';
import {
  IOrderCredentials,
  OrderCredentialsSchema,
} from './references/order/OrderCredentials';

export const DOCUMENT_NAME = 'Order';
export const COLLECTION_NAME = 'orders';

export enum OrderState {
  NotPaid = 'not_paid',
  WaitingForAccount = 'waiting_for_account',
  WaitingForBooster = 'waiting_for_booster',
  Boosting = 'boosting',
  VerificationRequired = 'verification_required',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export default interface IOrder extends Document {
  orderId?: number;
  title?: string;
  game?: string;
  service?: ServiceCode;
  filter?: IServiceFilter;
  totalPrice: number;
  boosterPrice?: number;
  details: IOrderDetails;
  bonus?: IOrderBonus;
  coupon?: ICoupon;
  booster?: IUser;
  customer?: IUser;
  credentials?: IOrderCredentials;
  state: OrderState;
  photos: string[];
  startedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  embed?: any; // remove after send notification
  DeletionFlag?: boolean;
  flagTime?: Date;
  gclid?: string;
}

const schema = new Schema(
  {
    title: {
      type: Schema.Types.String,
      required: true,
    },
    game: {
      type: Schema.Types.String,
      required: true,
      enum: [
        GameCode.Unknown,
        GameCode.LeagueOfLegends,
        GameCode.Valorant,
        GameCode.TeamfightTactics,
        GameCode.WildRift,
      ],
    },
    service: {
      type: Schema.Types.String,
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
    filter: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceFilter',
    },
    totalPrice: {
      type: Schema.Types.Number,
      default: 0,
    },
    boosterPrice: {
      type: Schema.Types.Number,
      default: 0,
      select: false,
    },
    details: OrderDetailsSchema,
    bonus: OrderBonusSchema,
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      select: false,
    },
    booster: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    credentials: {
      type: OrderCredentialsSchema,
      select: false,
    },
    state: {
      type: Schema.Types.String,
      required: true,
      enum: [
        OrderState.NotPaid,
        OrderState.WaitingForAccount,
        OrderState.WaitingForBooster,
        OrderState.Boosting,
        OrderState.VerificationRequired,
        OrderState.Completed,
        OrderState.Cancelled,
      ],
      default: OrderState.NotPaid,
    },
    photos: {
      type: [Schema.Types.String],
      select: false,
    },
    startedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
    embed: {
      type: Schema.Types.Mixed,
    },
    DeletionFlag: {
      type: Boolean,
    },
    flagTime: {
      type: Date,
    },
    gclid: {
      type: String,
    },
  },
  {
    versionKey: false,
  },
);

schema.plugin(AutoIncrement as any, { inc_field: 'orderId', start_seq: 1000 });
schema.plugin(paginate);

export const OrderModel = model<IOrder, PaginateModel<IOrder>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
