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
import RaffleRepo from '@database/repository/RaffleRepo';

const router = express.Router();

router.delete(
  '/:raffleId',
  permissions([PermissionCode.EditStore]),
  authentication,
  authorization,
  validator(schema.raffleIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    await RaffleRepo.delete(req.params.raffleId);

    return new SuccessResponse(ApiMessage.RaffleDeleted).send(res);
  }),
);

export default router;
