import { Schema, model, Document } from 'mongoose';
import IUser from './User';

export const DOCUMENT_NAME = 'Keystore';
export const COLLECTION_NAME = 'keystores';

export default interface IKeystore extends Document {
  user: IUser;
  primaryKey: string;
  secondaryKey: string;
  status?: boolean;
  createdAt?: Date;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    primaryKey: {
      type: Schema.Types.String,
      required: true,
    },
    secondaryKey: {
      type: Schema.Types.String,
      required: true,
    },
    status: {
      type: Schema.Types.Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      required: true,
      select: false,
    },
  },
  {
    versionKey: false,
  },
);

schema.index({ user: 1, primaryKey: 1 });
schema.index({ user: 1, primaryKey: 1, secondaryKey: 1 });

export const KeystoreModel = model<IKeystore>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
