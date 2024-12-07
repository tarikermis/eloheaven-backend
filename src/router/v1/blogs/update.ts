import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';
import { PermissionCode } from '@common/Permission';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import permissions from '@helpers/permissions';
import BlogPostRepo from '@database/repository/BlogPostRepo';
import { BadRequestError } from '@core/ApiError';
import { slugify } from '@helpers/string';
import { convert } from 'html-to-text';
import { sha256 } from '@helpers/hash';
const router = express.Router();

router.put(
  '/:postId',
  permissions([PermissionCode.EditPosts]),
  authentication,
  authorization,
  validator(schema.blogPost),
  validator(schema.blogIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const post = await BlogPostRepo.findById(req.params.postId as any);
    const category = await BlogPostRepo.findCategoryById(req.body.category);

    if (!post) throw new BadRequestError(ApiMessage.BlogPostNotFound);
    if (!category) throw new BadRequestError(ApiMessage.BlogCategoryNotFound);

    const txt = convert(req.body.body).split(' ').length / 200;

    post.title = req.body.title;
    post.body = req.body.body;
    post.description = req.body.description;
    post.thumbnail = req.body.thumbnail;
    (post.keywords = req.body.keywords.split(',').map((x: any) => x.trim())),
      (post.category = category);
    // post.author = req.user;
    post.slug =
      slugify(req.body.title) + `-${sha256(req.body.title).slice(0, 7)}`;
    post.readingTime = `${Math.ceil(txt)}`;

    await BlogPostRepo.updateInfo(post);

    return new SuccessResponse(ApiMessage.BlogPostUpdated).send(res);
  }),
);

export default router;
