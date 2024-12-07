import { Schema, model, Document } from 'mongoose';

export const DOCUMENT_NAME = 'Service';
export const COLLECTION_NAME = 'services';

export default interface IService extends Document {
  service: string;
  data: string[][];
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema(
  {
    service: {
      type: Schema.Types.String,
      required: true,
    },
    data: {
      type: [[Schema.Types.String]],
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      required: true,
      select: false,
    },
    updatedAt: {
      type: Date,
      required: true,
      select: false,
    },
  },
  {
    versionKey: false,
  },
);

export const ServiceModel = model<IService>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
