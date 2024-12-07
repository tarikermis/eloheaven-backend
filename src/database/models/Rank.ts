import { Schema, model, Document, PaginateModel } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import { GameCode } from '@core/boost/Boost';

export const DOCUMENT_NAME = 'Rank';
export const COLLECTION_NAME = 'ranks';

export default interface IRank extends Document {
  game: string;
  code: string;
  name: string;
  division?: number;
  lp?: number;
  hierarchy: number;
}

const schema = new Schema(
  {
    game: {
      type: Schema.Types.String,
      required: true,
      enum: [
        GameCode.Unknown,
        GameCode.LeagueOfLegends,
        GameCode.Valorant,
        GameCode.TeamfightTactics,
        GameCode.WildRift,
      ],
      select: false,
    },
    code: {
      type: Schema.Types.String,
      required: true,
    },
    name: {
      type: Schema.Types.String,
      required: true,
    },
    division: {
      type: Schema.Types.Number,
      default: 0,
    },
    lp: {
      type: Schema.Types.Number,
      default: 0,
    },
    hierarchy: {
      type: Schema.Types.Number,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

schema.plugin(paginate);

export const RankModel = model<IRank, PaginateModel<IRank>>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
