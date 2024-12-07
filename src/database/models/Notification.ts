import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import IUser from './User';

export const DOCUMENT_NAME = 'Notification';
export const COLLECTION_NAME = 'notifications';

export default interface INotification extends Document {
  user: IUser;
  title: string;
  description: string;
  seen: boolean;
  redirectUrl?: string;
  slug?: string;
  createdAt: Date;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: Schema.Types.String,
      required: true,
    },
    description: {
      type: Schema.Types.String,
      required: true,
    },
    seen: {
      type: Schema.Types.Boolean,
      default: false,
    },
    redirectUrl: {
      type: Schema.Types.String,
    },
    slug: {
      type: Schema.Types.String,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

schema.plugin(paginate);
export const NotificationModel = model<
  INotification,
  PaginateModel<INotification>
>(DOCUMENT_NAME, schema, COLLECTION_NAME);
