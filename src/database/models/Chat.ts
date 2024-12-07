import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import IUser from './User';
import IOrder from './Order';

export const DOCUMENT_NAME = 'ChatMessage';
export const COLLECTION_NAME = 'chat_messages';

export const enum ChatChannel {
  General = 'general',
  Management = 'management',
}

export default interface IChatMessage extends Document {
  message: string;
  system: boolean;
  sender: IUser;
  order: IOrder;
  channel: string;
  seen: boolean;
  createdAt?: Date;
}

const schema = new Schema(
  {
    message: {
      type: Schema.Types.String,
    },
    system: {
      type: Schema.Types.Boolean,
      default: false,
    },
    channel: {
      type: Schema.Types.String,
      enum: [ChatChannel.General, ChatChannel.Management],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    seen: {
      type: Schema.Types.Boolean,
      default: false,
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

export const ChatModel = model<IChatMessage, PaginateModel<IChatMessage>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
