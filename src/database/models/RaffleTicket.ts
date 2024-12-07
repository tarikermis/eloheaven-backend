import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import IUser from './User';
import IRaffle from './Raffle';

export const DOCUMENT_NAME = 'RaffleTicket';
export const COLLECTION_NAME = 'raffle_tickets';

export default interface IRaffleTicket extends Document {
  user: IUser;
  raffle: IRaffle;
  ticketList?: number[];
  value: number;
  createdAt: Date;
}

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    raffle: {
      type: Schema.Types.ObjectId,
      ref: 'Raffle',
    },
    ticketList: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    value: {
      type: Schema.Types.Number,
      required: true,
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

export const RaffleTicketModel = model<
  IRaffleTicket,
  PaginateModel<IRaffleTicket>
>(DOCUMENT_NAME, schema, COLLECTION_NAME);
