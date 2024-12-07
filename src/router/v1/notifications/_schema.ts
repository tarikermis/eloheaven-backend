import Joi from 'joi';
import { JoiObjectId } from '@helpers/validator';

export default {
  notification: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
};
