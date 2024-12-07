import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { PermissionCode } from '@common/Permission';

export const DOCUMENT_NAME = 'Role';
export const COLLECTION_NAME = 'roles';

export const enum RoleCode {
  Admin = 'admin',
  User = 'user',
  Booster = 'booster',
}

export default interface IRole extends Document {
  code: string;
  permissions: string[];
  status?: boolean;
  createdAt?: Date;
}

const schema = new Schema(
  {
    code: {
      type: Schema.Types.String,
      required: true,
      enum: [RoleCode.Admin, RoleCode.User, RoleCode.Booster],
    },
    permissions: {
      type: [Schema.Types.String],
      required: true,
      default: [PermissionCode.Any],
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

schema.plugin(paginate);

export const RoleModel = model<IRole, PaginateModel<IRole>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
