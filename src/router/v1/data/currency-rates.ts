import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { InternalError } from '@core/ApiError';
import redisClient from '../../../redis';
import { getCurrencyRates } from '@common/Currency';
import { redisKeys } from '@config';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req: IRoleRequest, res) => {
    const now = parseInt((Date.now() / 1000).toString());
    const expire = parseInt((Date.now() / 1000).toString()) + 60 * 60; // 60 min
    let cacheData = await redisClient.get(redisKeys.currencyRates);
    const cacheJson = cacheData ? JSON.parse(cacheData) : null;

    // Response not cached or expired
    if (!cacheJson || (cacheJson && cacheJson.expireAt < now)) {
      const getRates = await getCurrencyRates();

      if (!getRates) throw new InternalError(ApiMessage.SomethingWrong);

      const currencyRates = {
        usd: getRates.rates.USD,
        eur: getRates.rates.EUR,
        gbp: getRates.rates.GBP,
        cad: getRates.rates.CAD,
        aud: getRates.rates.AUD,
        expireAt: expire,
      };

      cacheData = JSON.stringify(currencyRates);
      await redisClient.set(redisKeys.currencyRates, cacheData);

      const json = JSON.parse(cacheData);
      return new SuccessResponse(ApiMessage.FreshData, json).send(res);
    }

    if (cacheData) {
      const json = JSON.parse(cacheData);
      return new SuccessResponse(ApiMessage.CachedData, json).send(res);
    }
  }),
);

export default router;
