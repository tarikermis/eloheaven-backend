import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { InternalError } from '@core/ApiError';
import GeoCacheRepo from '@database/repository/GeoCacheRepo';
import { environment } from '@config';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req: IRoleRequest, res) => {
    if (environment === 'development')
      return new SuccessResponse(ApiMessage.FreshData, {
        ipAddress: '127.0.0.1',
        countryCode: 'US',
        latitude: 1.0,
        longtide: 1.0,
        timezone: 'Europe/Istanbul',
        isp: 'Development',
        updatedAt: Date.now(),
      }).send(res);

    const result = await GeoCacheRepo.init(req.ipAddress);

    if (!result) throw new InternalError(ApiMessage.SomethingWrong);

    return new SuccessResponse(
      result.from === 'cache' ? ApiMessage.CachedData : ApiMessage.FreshData,
      {
        ...result.data,
      },
    ).send(res);
  }),
);

export default router;
