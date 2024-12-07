import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import CouponRepo from '@database/repository/CouponRepo';
import authentication from '@core/auth/authentication';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import ICoupon from '@database/models/Coupon';

const router = express.Router();

router.get(
  '/',
  permissions([PermissionCode.EditStore]),
  authentication,
  authorization,
  asyncHandler(async (req: IRoleRequest, res) => {
    let coupons: any = await CouponRepo.findAll();
    if (coupons) {
      coupons = await Promise.all(
        coupons.map(async (coupon: ICoupon) => {
          return {
            ...coupon,
            volume: await CouponRepo.getTotalSum(coupon),
          };
        }),
      );
    }
    return new SuccessResponse(ApiMessage.FreshData, coupons).send(res);
  }),
);

export default router;
