import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import schema from './_schema';
import BlogPostRepo from '@database/repository/BlogPostRepo';
import validator, { ValidationSource } from '@helpers/validator';
import { BadRequestError } from '@core/ApiError';
import { Types } from 'mongoose';
import { lang } from 'moment';

const router = express.Router();

// TODO: required?
const defaultSelect =
  '_id title body description keywords category author.username author.profilePicture slug';

router.get(
  '/id/:postId',
  validator(schema.blogIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    const post = await BlogPostRepo.findById(req.params.postId as any);

    if (!post) throw new BadRequestError(ApiMessage.BlogPostNotFound);

    return new SuccessResponse(ApiMessage.Success, post).send(res);
  }),
);

router.get(
  '/slug/:slug',
  validator(schema.blogSlug, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    const post = await BlogPostRepo.findBySlug(req.params.slug as any);

    if (!post) throw new BadRequestError(ApiMessage.BlogPostNotFound);

    return new SuccessResponse(ApiMessage.Success, post).send(res);
  }),
);

router.post(
  '/list',
  validator(schema.list),
  asyncHandler(async (req: IRoleRequest, res) => {
    //? Build query
    const query: any = {};
    if (req.body.language) {
      query.language = { $regex: `^${req.body.language}_.*`, $options: 'i' };
    }
    if (req.body.search && req.body.search.length > 0)
      query['$or'] = [
        { title: { $regex: req.body.search, $options: 'i' } },
        { body: { $regex: req.body.search, $options: 'i' } },
      ];

    if (req.body.category && req.body.category.length > 0)
      query['category'] = new Types.ObjectId(req.body.category);

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      select: '-body',
      populate: [
        {
          path: 'category',
          select: { _id: 1, title: 1, description: 1 },
        },
        {
          path: 'author',
          select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
        },
      ],
    };
    const result = await BlogPostRepo.paginate(query, options);

    const response = {
      page: result.page,
      docs: result.docs,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
    };

    return new SuccessResponse(ApiMessage.Success, response).send(res);
  }),
);

export default router;
