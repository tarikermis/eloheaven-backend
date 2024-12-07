import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import championsList from '@data/champions.json';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req: IRoleRequest, res) => {
    new SuccessResponse(ApiMessage.CachedData, [...championsList]).send(res);
  }),
);

export default router;
