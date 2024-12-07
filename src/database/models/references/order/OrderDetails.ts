import { Schema } from 'mongoose';

const OrderDetailsGeneralSchema = new Schema(
  {
    current: {
      tier: {
        type: Schema.Types.String,
      },
      division: {
        type: Schema.Types.Number,
      },
      lp: {
        type: Schema.Types.Number,
      },
      rr: {
        type: Schema.Types.Number,
      },
      mark: {
        type: Schema.Types.Number,
      },
      rank: {
        type: Schema.Types.ObjectId,
        ref: 'Rank',
      },
    },
    target: {
      tier: {
        type: Schema.Types.String,
      },
      division: {
        type: Schema.Types.Number,
      },
      lp: {
        type: Schema.Types.Number,
      },
      rr: {
        type: Schema.Types.Number,
      },
      mark: {
        type: Schema.Types.Number,
      },
      rank: {
        type: Schema.Types.ObjectId,
        ref: 'Rank',
      },
    },
    rrCurrent: {
      type: Schema.Types.String,
    },
    lpCurrent: {
      type: Schema.Types.String,
    },
    lpGain: {
      type: Schema.Types.String,
    },
    winCount: {
      type: Schema.Types.Number,
    },
    matchCount: {
      type: Schema.Types.Number,
    },
    server: {
      type: Schema.Types.String,
    },
    queueType: {
      type: Schema.Types.String,
    },
    sessionTime: {
      type: Schema.Types.Number,
    },
    duoOrder: {
      type: Schema.Types.Boolean,
    },
  },
  {
    _id: false,
    versionKey: false,
    timestamps: false,
  },
);
// TODO: Update (may cause problem)
export const OrderDetailsSchema = new Schema(
  {
    general: {
      type: OrderDetailsGeneralSchema,
    },
    extras: {
      type: Schema.Types.Mixed,
    },
    summary: {
      type: Schema.Types.Mixed,
      select: false,
    },
  },
  {
    _id: false,
    versionKey: false,
    timestamps: false,
  },
);
