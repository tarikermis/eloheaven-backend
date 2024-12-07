import { Schema } from 'mongoose';
import { IServiceConfig, ServiceConfigSchema } from './ServiceConfig';

export interface IBoosterDetails {
  vip: boolean;
  coach: boolean; // public
  coachingPrice: number; // public
  soloClaimLimit: number;
  duoClaimLimit: number;
  services: IServiceConfig[];
  adminNote: string;
  assignable: boolean; // assign me as booster
  createdAt: Date;
}

export const BoosterDetailsSchema = new Schema(
  {
    vip: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },
    coach: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },
    coachingPrice: {
      type: Schema.Types.Number,
      default: 0,
      required: true,
    },
    soloClaimLimit: {
      type: Schema.Types.Number,
      default: 0,
      required: true,
    },
    duoClaimLimit: {
      type: Schema.Types.Number,
      default: 0,
      required: true,
    },
    services: {
      type: [ServiceConfigSchema],
    },
    adminNote: {
      type: Schema.Types.String,
      required: true,
    },
    assignable: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
    versionKey: false,
  },
);
