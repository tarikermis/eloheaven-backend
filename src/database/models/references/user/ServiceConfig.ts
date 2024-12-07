import { Schema } from 'mongoose';
import IServiceFilter from '@database/models/ServiceFilter';
import IRank from '@database/models/Rank';

export interface IServiceConfig {
  ranks: IRank[];
  commission: number;
  filter: IServiceFilter;
}

export const ServiceConfigSchema = new Schema(
  {
    ranks: {
      type: [Schema.Types.ObjectId],
      ref: 'Rank',
      required: true,
    },
    commission: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    filter: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceFilter',
    },
  },
  {
    _id: false,
    timestamps: false,
    versionKey: false,
  },
);
