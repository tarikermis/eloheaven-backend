import { GameCode } from '@core/boost/Boost';
import { Schema } from 'mongoose';

export interface IUserProfile {
  country: string;
  features: string[];
  description: string;
  games: string[];
  languages: string[];
  lolPrimaryLane: string;
  lolSecondaryLane: string[];
  lolChampions: string[];
  valAgents: string[];
  nameStyle: number;
}

export const UserProfileSchema = new Schema(
  {
    country: {
      type: Schema.Types.String,
    },
    features: {
      type: [Schema.Types.String],
    },
    description: {
      type: Schema.Types.String,
    },
    games: {
      type: [Schema.Types.String],
      enum: [
        GameCode.LeagueOfLegends,
        GameCode.Valorant,
        GameCode.TeamfightTactics,
        GameCode.WildRift,
      ],
    },
    languages: {
      type: [Schema.Types.String],
      required: true,
    },
    lolPrimaryLane: {
      type: Schema.Types.String,
    },
    lolSecondaryLane: {
      type: [Schema.Types.String],
    },
    lolChampions: {
      type: [Schema.Types.String],
    },
    valAgents: {
      type: [Schema.Types.String],
    },
    nameStyle: {
      type: Schema.Types.Number,
      default: 0,
    },
    updatedAt: {
      type: Schema.Types.Date,
    },
  },
  {
    _id: false,
    versionKey: false,
  },
);
