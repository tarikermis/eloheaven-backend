import express from 'express';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import ServiceRepo from '@database/repository/ServiceRepo';

const router = express.Router();

router.get(
  '/',
  permissions([PermissionCode.EditStore]),
  authentication,
  authorization,
  // validation is not required because we are using static limit, page values.
  // validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const result = await ServiceRepo.getAllFilters();

    return new SuccessResponse(ApiMessage.Success, result).send(res);
  }),
);

export default router;
