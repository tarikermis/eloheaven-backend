import express from 'express';
import schema from './_schema';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import _ from 'lodash';
import validator, { ValidationSource } from '@helpers/validator';
import ICoupon, { CouponModel } from '@database/models/Coupon';
import { BadRequestError } from '@core/ApiError';
const router = express.Router();

router.get(
  '/:service',
  validator(schema.services, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    const coupon = await CouponModel.findOne({
      scope: { $in: req.params.service },
      autoApply: true,
      status: true,
    })
      .sort({ createdAt: -1 })
      .lean<ICoupon>()
      .exec();

    if (!coupon) throw new BadRequestError(ApiMessage.CouponNotFound);

    return new SuccessResponse(
      ApiMessage.Success,
      _.pick(coupon, ['discount', 'type', 'code']),
    ).send(res);
  }),
);

export default router;
