import { ChatChannel } from '@database/models/Chat';
import { JoiObjectId } from '@helpers/validator';
import Joi from 'joi';

export default {
  joinRoom: Joi.object().keys({
    method: Joi.string().required().valid('joinRoom'),
    channel: Joi.string()
      .required()
      .valid(ChatChannel.Management, ChatChannel.General),
    orderId: JoiObjectId(),
  }),
  leaveRoom: Joi.object().keys({
    method: Joi.string().required().valid('leaveRoom'),
    channel: Joi.string()
      .required()
      .valid(ChatChannel.Management, ChatChannel.General),
    orderId: JoiObjectId(),
  }),
  readMessages: Joi.object().keys({
    method: Joi.string().required().valid('readMessages'),
    channel: Joi.string()
      .required()
      .valid(ChatChannel.Management, ChatChannel.General),
    orderId: JoiObjectId(),
  }),
};
