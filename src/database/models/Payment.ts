import { Schema, model, Document, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Payment';
export const COLLECTION_NAME = 'payments';

export const enum PaymentScope {
  AddFunds = 'add_funds',
  Order = 'order',
  Product = 'product',
  Tip = 'tip',
}

export const enum PaymentMethod {
  Stripe = 'stripe',
  Coinbase = 'coinbase',
  Paypal = 'paypal',
  Balance = 'balance',
}
export const enum PaymentState {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export default interface IPayment extends Document {
  target: Types.ObjectId;
  scope: PaymentScope;
  amount: number;
  method: PaymentMethod;
  state: PaymentState;
  details: {
    id: string;
    description: string;
    // remaining balance
    userId?: Types.ObjectId;
    refundBalance?: boolean;
    refundAmount?: number;

    // for google tag manager (gtm)
    userProvidedAmount: number;
    userCurrency: string;
  };
  updatedAt?: Date;
  createdAt?: Date;
}

const schema = new Schema(
  {
    target: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    scope: {
      type: Schema.Types.String,
      required: true,
      default: [
        PaymentScope.AddFunds,
        PaymentScope.Order,
        PaymentScope.Product,
        PaymentScope.Tip,
      ],
    },
    amount: {
      type: Schema.Types.Number,
      default: 0,
    },
    method: {
      type: Schema.Types.String,
      required: true,
      default: [
        PaymentMethod.Stripe,
        PaymentMethod.Coinbase,
        PaymentMethod.Paypal,
        PaymentMethod.Balance,
      ],
    },
    state: {
      type: Schema.Types.String,
      required: true,
      default: PaymentState.Pending,
      enum: [PaymentState.Pending, PaymentState.Completed, PaymentState.Failed],
    },
    details: {
      type: Schema.Types.Mixed,
    },
    updatedAt: {
      type: Date,
      required: true,
      select: false,
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

export const PaymentModel = model<IPayment>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
