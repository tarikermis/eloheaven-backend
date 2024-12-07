import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator from '@helpers/validator';
import { PermissionCode } from '@common/Permission';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import permissions from '@helpers/permissions';
import IBlogPost from '@database/models/BlogPost';
import BlogPostRepo from '@database/repository/BlogPostRepo';
import { BadRequestError } from '@core/ApiError';
import { slugify } from '@helpers/string';
import { convert } from 'html-to-text';
import { sha256 } from '@helpers/hash';

const router = express.Router();

router.post(
  '/',
  permissions([PermissionCode.EditPosts]),
  authentication,
  authorization,
  validator(schema.blogPost),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const category = await BlogPostRepo.findCategoryById(req.body.category);

    if (!category) throw new BadRequestError(ApiMessage.BlogCategoryNotFound);

    const options = {
      wordwrap: 130,
      // ...
    };

    const txt = convert(req.body.body).split(' ').length / 200;

    const blogPost = {
      title: req.body.title,
      body: req.body.body,
      description: req.body.description,
      keywords: req.body.keywords.split(',').map((x: any) => x.trim()),
      category: category,
      author: req.user._id,
      thumbnail: req.body.thumbnail,
      language: req.body.language,
      slug: slugify(req.body.title) + `-${sha256(req.body.title).slice(0, 7)}`,
      readingTime: `${Math.ceil(txt)}`,
    } as IBlogPost;

    const createdBlog = await BlogPostRepo.create(blogPost);

    new SuccessResponse(ApiMessage.BlogPostCreated, { ...createdBlog }).send(
      res,
    );
  }),
);

export default router;
