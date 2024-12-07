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
import { BadRequestError } from '@core/ApiError';

const router = express.Router();

router.put(
  '/:couponId',
  permissions([PermissionCode.EditStore]),
  authentication,
  authorization,
  validator(schema.createOrUpdate),
  validator(schema.couponIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    const coupon = await CouponRepo.findByIdAdmin(req.params.couponId as any);

    if (!coupon) throw new BadRequestError(ApiMessage.CouponNotFound);

    coupon.code = req.body.code;
    coupon.discount = req.body.discount;
    coupon.type = req.body.type;
    coupon.scope = req.body.scope;
    coupon.limit = req.body.limit;
    coupon.expireAt = req.body.expireAt;
    coupon.autoApply = req.body.autoApply;

    await CouponRepo.updateInfo(coupon);

    new SuccessResponse(ApiMessage.CouponUpdated).send(res);
  }),
);

export default router;
