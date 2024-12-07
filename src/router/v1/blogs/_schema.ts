import { JoiObjectId } from '@helpers/validator';
import Joi from 'joi';

export default {
  list: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(1000).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
    category: Joi.string().allow(''),
    language: Joi.string().allow(''),
  }),
  blogPost: Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    description: Joi.string().required(),
    keywords: Joi.string().required(),
    category: JoiObjectId().required(),
    thumbnail: Joi.string().required(),
    language: Joi.string().required(),
  }),
  blogIdParam: Joi.object().keys({
    postId: JoiObjectId().required(),
  }),
  blogSlug: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};
