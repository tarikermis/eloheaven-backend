import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';
import schema from './_schema';
import { PermissionCode } from '@common/Permission';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import permissions from '@helpers/permissions';
import BlogPostRepo from '@database/repository/BlogPostRepo';

const router = express.Router();

router.delete(
  '/:postId',
  permissions([PermissionCode.EditPosts]),
  authentication,
  authorization,
  validator(schema.blogIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    await BlogPostRepo.delete(req.params.postId);

    return new SuccessResponse(ApiMessage.BlogPostDeleted).send(res);
  }),
);

export default router;
