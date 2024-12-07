import Joi from 'joi';

export default {
  dates: Joi.object().keys({
    dateFrom: Joi.date().required(),
    dateTo: Joi.date().required(),
  }),
};
