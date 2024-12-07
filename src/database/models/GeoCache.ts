import { Schema, model, Document } from 'mongoose';

export const DOCUMENT_NAME = 'GeoCache';
export const COLLECTION_NAME = 'geo_cache';

export default interface IGeoCache extends Document {
  ipAddress: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema(
  {
    ipAddress: {
      type: Schema.Types.String,
      required: true,
    },
    countryCode: {
      type: Schema.Types.String,
      required: true,
    },
    latitude: {
      type: Schema.Types.Number,
      default: 0,
      required: true,
    },
    longitude: {
      type: Schema.Types.Number,
      default: 0,
      required: true,
    },
    timezone: {
      type: Schema.Types.String,
      required: true,
    },
    isp: {
      type: Schema.Types.String,
      required: true,
    },
    createdAt: {
      type: Schema.Types.Date,
      required: true,
    },
    updatedAt: {
      type: Schema.Types.Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

export const GeoCacheModel = model<IGeoCache>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
