import Joi from 'joi';
import { JoiObjectId } from '@helpers/validator';
import { ChatChannel } from '@database/models/Chat';

export default {
  chat: Joi.object().keys({
    orderId: JoiObjectId().required(),
    channel: Joi.string()
      .required()
      .valid(ChatChannel.Management, ChatChannel.General),
  }),
  unreadMessages: Joi.object().keys({
    orderId: JoiObjectId().required(),
  }),
  delMessage: Joi.object().keys({
    orderId: JoiObjectId().required(),
    channel: Joi.string()
      .required()
      .valid(ChatChannel.Management, ChatChannel.General),
    messageId: JoiObjectId().required(),
  }),
  list: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(10000).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
  }),
  sendMessage: Joi.object().keys({
    message: Joi.string().required().min(1).max(512),
  }),
};
