import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export const DOCUMENT_NAME = 'Raffle';
export const COLLECTION_NAME = 'raffles';

export default interface IRaffle extends Document {
  name: string;
  description: string;
  slug: string;
  guid: string;
  rewards: {
    name: string;
    description: string;
    image_url: string;
    quantity: number;
  }[];
  ticketCost: number;
  ticketCount: number;
  status: boolean;
  startTime: Date;
  endTime: Date;
}

const schema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },
    description: {
      type: Schema.Types.String,
      required: true,
    },
    slug: {
      type: Schema.Types.String,
      required: true,
    },
    guid: {
      type: Schema.Types.String,
      required: true,
    },
    rewards: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    ticketCost: {
      type: Schema.Types.Number,
      required: true,
    },
    ticketCount: {
      type: Schema.Types.Number,
      required: true,
    },
    status: {
      type: Schema.Types.Boolean,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

schema.plugin(paginate);

export const RaffleModel = model<IRaffle, PaginateModel<IRaffle>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
