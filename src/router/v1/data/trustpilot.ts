import express from 'express';
import { IPublicRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import axios from 'axios';
import { SuccessResponse } from '@core/ApiResponse';
import { InternalError } from '@core/ApiError';
import redisClient from '../../../redis';
import { redisKeys } from '@config';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req: IPublicRequest, res) => {
    const now = parseInt((Date.now() / 1000).toString());
    const expire = parseInt((Date.now() / 1000).toString()) + 10 * 60; // 10 min
    let cacheData = await redisClient.get(redisKeys.trustpilot);
    const cacheJson = cacheData ? JSON.parse(cacheData) : null;

    // Response not cached or expired
    if (!cacheJson || (cacheJson && cacheJson.expireAt < now)) {
      const consumerSite = await axios
        .get('https://www.trustpilot.com/review/eloheaven.gg')
        .then((res) => {
          const html = res.data;
          const reviewsCount = html.substring(
            html.lastIndexOf(`"businessunitprofile-consumersite-`) + 34,
            html.lastIndexOf(`","assetPrefix":`),
          );
          return reviewsCount;
        })
        .catch((err) => {
          throw new InternalError(ApiMessage.SomethingWrong);
        });

      const response: any = await axios
        .get(
          `https://www.trustpilot.com/_next/data/businessunitprofile-consumersite-${consumerSite}/review/eloheaven.gg.json?businessUnit=eloheaven.gg&languages=all&stars=4&stars=5&sort=recency`,
          {
            headers: {
              'x-nextjs-data': 1,
            },
          },
        )
        .catch((err) => {
          throw new InternalError(ApiMessage.SomethingWrong);
        });

      const trustpilot = {
        pageUrl: response.data.pageProps.pageUrl,
        businessUnit: {
          id: response.data.pageProps.businessUnit.id,
          displayName: response.data.pageProps.businessUnit.displayName,
          identifyingName: response.data.pageProps.businessUnit.identifyingName,
          numberOfReviews: response.data.pageProps.businessUnit.numberOfReviews,
          trustScore: response.data.pageProps.businessUnit.trustScore,
          stars: response.data.pageProps.businessUnit.stars,
        },
        reviews: response.data.pageProps.reviews.map((review: any) => {
          return {
            id: review.id,
            text: review.text,
            title: review.title,
            rating: review.rating,
            consumer: {
              id: review.consumer.id,
              displayName: review.consumer.displayName,
              countryCode: review.consumer.countryCode,
            },
          };
        }),
        expireAt: expire,
      };

      cacheData = JSON.stringify(trustpilot);
      await redisClient.set(redisKeys.trustpilot, cacheData);

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
