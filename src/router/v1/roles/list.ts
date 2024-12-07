import express from 'express';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import RoleRepo from '@database/repository/RoleRepo';

const router = express.Router();

router.get(
  '/',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};

    const options = {
      limit: 1000,
      page: 1,
    };

    const result = await RoleRepo.paginate(query, options);

    return new SuccessResponse(ApiMessage.Success, result.docs).send(res);
  }),
);

export default router;
