import { Schema } from 'mongoose';

export interface IOrderCredentials {
  username?: string;
  password?: string;
  nickname?: string;
  riotId?: string;
  createdAt: Date;

  // for riot api
  puuid?: string;

  // hash ( game + nickname.toLowerCase() )
  hash?: string;
}

export const OrderCredentialsSchema = new Schema(
  {
    username: {
      type: Schema.Types.String,
    },
    password: {
      type: Schema.Types.String,
    },
    nickname: {
      type: Schema.Types.String,
    },
    riotId: {
      type: Schema.Types.String,
    },
    puuid: {
      type: Schema.Types.String,
    },
    hash: {
      type: Schema.Types.String,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
    versionKey: false,
    timestamps: false,
  },
);
