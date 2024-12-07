import Joi from 'joi';
import { JoiObjectId } from '@helpers/validator';
import { OrderState } from '@database/models/Order';
import { GameCode } from '@core/boost/Boost';
import { TransactionTag } from '@database/models/Transaction';

export default {
  orderId: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  orderNum: Joi.object().keys({
    order_num: Joi.number().integer().min(1).max(100000000).required(),
  }),
  stateForBoosters: Joi.object().keys({
    state: Joi.string()
      .valid('available-orders', 'active-orders', 'completed-orders')
      .required(),
  }),
  list: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(500).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
  }),
  listOnlyState: Joi.object().keys({
    state: Joi.string()
      .valid(
        OrderState.NotPaid,
        OrderState.WaitingForAccount,
        OrderState.WaitingForBooster,
        OrderState.Boosting,
        OrderState.VerificationRequired,
        OrderState.Completed,
        OrderState.Cancelled,
      )
      .required(),
  }),
  listGameState: Joi.object().keys({
    game: Joi.string()
      .valid(
        GameCode.LeagueOfLegends,
        GameCode.Valorant,
        GameCode.TeamfightTactics,
        GameCode.WildRift,
      )
      .required(),
    state: Joi.string()
      .valid(
        OrderState.NotPaid,
        OrderState.WaitingForAccount,
        OrderState.WaitingForBooster,
        OrderState.Boosting,
        OrderState.VerificationRequired,
        OrderState.Completed,
        OrderState.Cancelled,
      )
      .required(),
  }),
  editOrderDetails: Joi.object().keys({
    id: JoiObjectId().required(),
    order: Joi.object(), // TODO: add some details
  }),
  claimOrder: Joi.object().keys({
    id: JoiObjectId().required(),
    captchaResponse: Joi.string().required(),
  }),
  verifyOrder: Joi.object().keys({
    order: JoiObjectId().required(),
    type: Joi.string().valid('AddBalance', 'SubtractBalance'),
    amount: Joi.number().strict().min(0).optional(),
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
  editOrderState: Joi.object().keys({
    id: JoiObjectId().required(),
    state: Joi.string()
      .valid(
        OrderState.NotPaid,
        OrderState.WaitingForAccount,
        OrderState.WaitingForBooster,
        OrderState.Boosting,
        OrderState.VerificationRequired,
        OrderState.Completed,
        OrderState.Cancelled,
      )
      .required(),
  }),
  editOrderBooster: Joi.object().keys({
    id: JoiObjectId().required(),
    booster: JoiObjectId().required(),
  }),
  deleteOrderBooster: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  deleteOrderPhotos: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  userOrderScope: Joi.object().keys({
    scope: Joi.string().valid('all', 'on-going').required(),
  }),
  updateOrderCredentials: Joi.object().keys({
    id: JoiObjectId().required(),
    username: Joi.string().allow('').max(64),
    password: Joi.string().allow('').max(64),
    nickname: Joi.string().allow('').max(64),
    riotId: Joi.string().allow('').max(64),
  }),
};
