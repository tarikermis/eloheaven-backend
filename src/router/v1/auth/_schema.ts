import Joi from 'joi';
import { JoiAuthBearer, JoiUsername } from '@helpers/validator';

export default {
  register: Joi.object().keys({
    username: JoiUsername()
      .required()
      .messages({ 'any.invalid': 'invalid_username' }),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    captchaResponse: Joi.string().optional(),
    acceptTos: Joi.boolean().valid(true),
  }),
  guestRegister: Joi.object().keys({
    email: Joi.string().required().email(),
    captchaResponse: Joi.string().required(),
    acceptTos: Joi.boolean().valid(true),
  }),
  login: Joi.object().keys({
    username: Joi.string().required().min(3).max(64),
    password: Joi.string().required().min(6),
    remember: Joi.boolean().required(),
    captchaResponse: Joi.string().optional(),
  }),
  refreshToken: Joi.object().keys({
    refreshToken: Joi.string().required().min(1),
  }),
  resetPassword: Joi.object().keys({
    email: Joi.string().required().email(),
    captchaResponse: Joi.string().required(),
  }),
  resetPasswordApply: Joi.object().keys({
    token: Joi.string().required(),
    newPassword: Joi.string().required().min(6),
  }),
  auth: Joi.object()
    .keys({
      authorization: JoiAuthBearer().required(),
    })
    .unknown(true),
};
