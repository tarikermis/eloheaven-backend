import { GameCode } from '@core/boost/Boost';
import { Schema, model, Document } from 'mongoose';

export const DOCUMENT_NAME = 'ServiceFilter';
export const COLLECTION_NAME = 'service_filters';

export default interface IServiceFilter extends Document {
  game: GameCode;
  title: string;
  service: string;
  server: string;
}

const schema = new Schema(
  {
    game: {
      type: Schema.Types.String,
      required: true,
    },
    title: {
      type: Schema.Types.String,
      required: true,
    },
    service: {
      type: Schema.Types.String,
      required: true,
    },
    server: {
      type: Schema.Types.String,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const ServiceFilterModel = model<IServiceFilter>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
