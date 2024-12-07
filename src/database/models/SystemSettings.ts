import { Schema, model, Document } from 'mongoose';

export const DOCUMENT_NAME = 'SystemSetting';
export const COLLECTION_NAME = 'system_settings';

export default interface ISystemSettings extends Document {
  riotApiKey: string;
  tipTax: number;
  lolBoostersRoleId: string;
  lolVipNotificationChannel: string;
  lolNotificationChannel: string;
  valBoostersRoleId: string;
  valVipNotificationChannel: string;
  valNotificationChannel: string;
  tftBoostersRoleId: string;
  tftVipNotificationChannel: string;
  tftNotificationChannel: string;
  wrBoostersRoleId: string;
  wrVipNotificationChannel: string;
  wrNotificationChannel: string;
  managementNotificationChannel: string;
  newAccountNotificationChannel: string;
}

const schema = new Schema(
  {
    riotApiKey: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    tipTax: {
      type: Schema.Types.Number,
      required: true,
      default: 25,
    },
    lolBoostersRoleId: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    lolVipNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    lolNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    valBoostersRoleId: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    valVipNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    valNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    tftBoostersRoleId: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    tftVipNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    tftNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    wrBoostersRoleId: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    wrVipNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    wrNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    managementNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
    newAccountNotificationChannel: {
      type: Schema.Types.String,
      required: true,
      default: '-',
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

export const SystemSettingsModel = model<ISystemSettings>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
