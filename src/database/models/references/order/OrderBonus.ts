import { Schema } from 'mongoose';
import { IncreaseType } from '@common/Price';

export interface IOrderBonus {
  price?: number;
  type?: IncreaseType;
  status?: boolean;
}

export const OrderBonusSchema = new Schema(
  {
    price: {
      type: Schema.Types.Number,
      default: 0,
    },
    type: {
      type: Schema.Types.String,
      enum: [IncreaseType.Direct, IncreaseType.Percentage],
      default: IncreaseType.Direct,
    },
    status: {
      type: Schema.Types.Boolean,
      default: false,
    },
  },
  {
    _id: false,
    versionKey: false,
    timestamps: false,
  },
);
