import { JoiObjectId } from '@helpers/validator';
import Joi from 'joi';
export default {
  createOrUpdate: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    rewards: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().required(),
          description: Joi.string().required(),
          image_url: Joi.string().required(),
          quantity: Joi.number().required(),
        }),
      )
      .required(),
    ticketCost: Joi.number().integer().strict().min(1).max(10000).required(),
    status: Joi.boolean().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().optional(),
  }),
  raffleIdParam: Joi.object().keys({
    raffleId: JoiObjectId().required(),
  }),
  list: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(1000).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
  }),
};
