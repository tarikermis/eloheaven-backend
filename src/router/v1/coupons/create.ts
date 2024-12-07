import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator from '@helpers/validator';
import schema from './_schema';
import { PermissionCode } from '@common/Permission';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import permissions from '@helpers/permissions';
import ICoupon from '@database/models/Coupon';
import CouponRepo from '@database/repository/CouponRepo';
import { BadRequestError } from '@core/ApiError';

const router = express.Router();

router.post(
  '/',
  permissions([PermissionCode.EditStore]),
  authentication,
  authorization,
  validator(schema.createOrUpdate),
  asyncHandler(async (req: IRoleRequest, res) => {
    const search = await CouponRepo.findByCode(req.body.code);

    if (search) throw new BadRequestError(ApiMessage.CouponAlreadyExists);

    const coupon = {
      code: req.body.code,
      discount: req.body.discount,
      type: req.body.type,
      scope: req.body.scope,
      limit: req.body.limit,
      autoApply: req.body.autoApply,
      expireAt: req.body.expireAt,
    } as ICoupon;

    const createdCoupon = await CouponRepo.create(coupon);

    new SuccessResponse(ApiMessage.CouponCreated, { ...createdCoupon }).send(
      res,
    );
  }),
);

export default router;
