import Joi from 'joi';
import { Types } from 'mongoose';
import Logger from '@core/Logger';
import { BadRequestError } from '@core/ApiError';
import { Request, Response, NextFunction } from 'express';

export enum ValidationSource {
  BODY = 'body',
  HEADER = 'headers',
  QUERY = 'query',
  PARAM = 'params',
}

export const JoiUsername = () =>
  Joi.string().custom((value: string, helpers) => {
    if (
      String(value).search(
        new RegExp(/^((?=[a-zA-Z0-9._]{3,20}$)(?!.*[_.]{2})[^_.].*[^_.])+$/),
      ) === -1
    )
      return helpers.error('any.invalid');
    return value;
  }, 'Username Validation');

export const JoiObjectId = () =>
  Joi.string().custom((value: string, helpers) => {
    if (!Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
    return value;
  }, 'ObjectId Validation');

export const JoiUrlEndpoint = () =>
  Joi.string().custom((value: string, helpers) => {
    if (value.includes('://')) return helpers.error('any.invalid');
    return value;
  }, 'URL Endpoint Validation');

export const JoiAuthBearer = () =>
  Joi.string().custom((value: string, helpers) => {
    if (!value.startsWith('Bearer ')) return helpers.error('any.invalid');
    if (!value.split(' ')[1]) return helpers.error('any.invalid');
    return value;
  }, 'Authorization Header Validation');

export default (
    schema: Joi.ObjectSchema,
    source: ValidationSource = ValidationSource.BODY,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.validate(req[source]);

      if (!error) return next();

      const { details } = error;
      const message = details
        .map((i) => i.message.replace(/['"]+/g, ''))
        .join(',');
      Logger.error(message);

      next(new BadRequestError(message));
    } catch (error) {
      next(error);
    }
  };

// only for some mailbox providers
export const isRussian = (email: string) => {
  const list = ['mail.ru', 'yandex.ru'];
  const provider = email.split('@')[1];
  return list.includes(provider);
};
