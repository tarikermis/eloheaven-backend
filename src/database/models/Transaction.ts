import IUser from '@database/models/User';
import { Schema, model, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export const DOCUMENT_NAME = 'Transaction';
export const COLLECTION_NAME = 'transactions';

export enum TransactionTag {
  AddFunds = 'add_funds',
  BoostPay = 'boost_pay',
  Tip = 'tip',
  Penalty = 'penalty',
  Normal = 'normal',
  Refund = 'refund',
}

export interface ITransaction {
  user: IUser;
  issuer?: IUser;
  amount: number;
  description: string;
  tag: TransactionTag;
  createdAt: Date;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    issuer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    description: {
      type: Schema.Types.String,
      default: 'Unknown',
    },
    tag: {
      type: Schema.Types.String,
      default: TransactionTag.Normal,
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

export const TransactionModel = model<
  ITransaction,
  PaginateModel<ITransaction>
>(DOCUMENT_NAME, schema, COLLECTION_NAME);
