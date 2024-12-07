import Joi from 'joi';
import { JoiObjectId, JoiUsername } from '@helpers/validator';
import { GameCode } from '@core/boost/Boost';
import { TransactionTag } from '@database/models/Transaction';

export default {
  userId: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  username: Joi.object().keys({
    username: JoiUsername()
      .required()
      .messages({ 'any.invalid': 'invalid_username' }),
  }),
  // boosters & (maybe) users
  updateProfile: Joi.object().keys({
    username: JoiUsername(),
    email: Joi.string().email(),
    assignable: Joi.boolean().strict(),
    coachingPrice: Joi.number().integer().min(1).max(25000),
    profile: Joi.object().keys({
      country: Joi.string().allow('').max(32).required(),
      features: Joi.array()
        .items(Joi.string().allow('').max(100))
        .max(3)
        .required(),
      description: Joi.string().allow('').max(300).required(),
      languages: Joi.array().items(Joi.string().allow('')).max(3).required(),
      lolPrimaryLane: Joi.string().allow('').max(300).required(),
      lolSecondaryLane: Joi.array()
        .items(Joi.string().allow(''))
        .max(4)
        .required(),
      lolChampions: Joi.array().items(Joi.string().allow('')).max(5).required(),
      valAgents: Joi.array().items(Joi.string().allow('')).max(5).required(),
      nameStyle: Joi.number().min(0).max(5),
    }),
  }),
  updatePassword: Joi.object().keys({
    oldPassword: Joi.string().required().min(6),
    newPassword: Joi.string().required().min(6),
  }),
  updateBalance: Joi.object().keys({
    user: JoiObjectId().required(),
    type: Joi.string().valid('AddBalance', 'SubtractBalance'),
    amount: Joi.number().strict().min(0),
    description: Joi.string().optional(),
    tag: Joi.string()
      .valid(
        TransactionTag.Normal,
        TransactionTag.Penalty,
        TransactionTag.Tip,
        TransactionTag.BoostPay,
        TransactionTag.AddFunds,
        TransactionTag.Refund,
      )
      .optional(),
  }),
  list: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(500).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
  }),
  boosterSearch: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(500).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
    assignable: Joi.boolean().strict(),
    coach: Joi.boolean().strict(),
    online: Joi.boolean().strict(),
    vip: Joi.boolean().strict(),
    games: Joi.array().items(
      Joi.string().valid(
        GameCode.LeagueOfLegends,
        GameCode.Valorant,
        GameCode.TeamfightTactics,
        GameCode.WildRift,
      ),
    ),
    languages: Joi.array().items(Joi.string().allow('')).required(),
  }),
  // admins
  updateDetails: Joi.object().keys({
    user: JoiObjectId().required(),
    username: JoiUsername(),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    status: Joi.boolean().strict(),
    role: JoiObjectId(),
    profilePicture: Joi.string().max(256).optional(), //TODO: remove optional when its implemented
    discordId: Joi.string().max(32),
    documents: Joi.array().items(Joi.string().max(256)),
    boosterDetails: Joi.object().keys({
      vip: Joi.boolean().strict().required(),
      coach: Joi.boolean().strict().required(),
      coachingPrice: Joi.number()
        .integer()
        .strict()
        .min(1)
        .max(25000)
        .required(),
      assignable: Joi.boolean().strict().required(),
      soloClaimLimit: Joi.number().integer().strict().min(0).max(50).required(),
      duoClaimLimit: Joi.number().integer().strict().min(0).max(50).required(),
      services: Joi.array()
        .items(
          Joi.object().keys({
            filter: JoiObjectId().required(),
            commission: Joi.number().integer().min(1).max(100).required(),
            ranks: Joi.array().items(JoiObjectId()).required(),
          }),
        )
        .required(),
      adminNote: Joi.string().allow(null, '').required(),
    }),
    profile: Joi.object().keys({
      country: Joi.string().allow('').max(32).required(),
      features: Joi.array()
        .items(Joi.string().allow('').max(100))
        .max(3)
        .required(),
      description: Joi.string().allow('').max(300).required(),
      games: Joi.array().items(Joi.string().allow('')).required(),
      languages: Joi.array().items(Joi.string().allow('')).required(),
      lolPrimaryLane: Joi.string().allow('').max(300).required(),
      lolSecondaryLane: Joi.array()
        .items(Joi.string().allow(''))
        .max(4)
        .required(),
      lolChampions: Joi.array()
        .items(Joi.string().allow(''))
        .max(250)
        .required(),
      valAgents: Joi.array().items(Joi.string().allow('')).max(25).required(),
      nameStyle: Joi.number().min(0).max(5),
    }),
  }),
};
