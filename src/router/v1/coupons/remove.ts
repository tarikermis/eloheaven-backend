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
import CouponRepo from '@database/repository/CouponRepo';

const router = express.Router();

router.delete(
  '/:couponId',
  permissions([PermissionCode.EditStore]),
  authentication,
  authorization,
  validator(schema.couponIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    await CouponRepo.delete(req.params.couponId);

    return new SuccessResponse(ApiMessage.CouponDeleted).send(res);
  }),
);

export default router;
