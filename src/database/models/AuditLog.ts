import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import IUser from './User';

export const DOCUMENT_NAME = 'AuditLog';
export const COLLECTION_NAME = 'audit_logs';

export const enum LogScope {
  Auth = 'auth',
  User = 'user',
  Order = 'order',
  Payment = 'payment',
  System = 'system',
  Marketplace = 'marketplace',
  Integration = 'integration',
}

export default interface IAuditLog extends Document {
  user?: IUser;
  message: string;
  scope: LogScope;
  createdAt: Date;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: Schema.Types.String,
      required: true,
    },
    scope: {
      type: Schema.Types.String,
      required: true,
      enum: [
        LogScope.Auth,
        LogScope.User,
        LogScope.Order,
        LogScope.Payment,
        LogScope.System,
        LogScope.Marketplace,
        LogScope.Integration,
      ],
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

export const AuditLogModel = model<IAuditLog, PaginateModel<IAuditLog>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
