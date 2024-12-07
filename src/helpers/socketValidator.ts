import Joi from 'joi';
import { Types } from 'mongoose';

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

/**
Validates requests for socket
*/
export default (schema: Joi.ObjectSchema, source: any) => {
  try {
    const { error } = schema.validate(source);

    if (!error) return true;

    const { details } = error;
    const message = details
      .map((i) => i.message.replace(/['"]+/g, ''))
      .join(',');

    return message;
  } catch (error) {
    return error;
  }
};
