import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator from '@helpers/validator';
import { BadRequestError } from '@core/ApiError';
import { existsSync } from 'fs';
import path from 'path';
const router = express.Router();

router.post(
  '/',
  validator(schema.process),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const serviceFilePath = path.resolve(
      __dirname + '../../../../core/boost/services/' + req.body.service + '.js',
    );

    if (!existsSync(serviceFilePath))
      throw new BadRequestError(ApiMessage.ServiceNotFound);

    const serviceFile = await import(serviceFilePath);

    const service = new serviceFile.default(req.body, schema.process);
    const initialize = await service.init();
    if (initialize !== true) throw new BadRequestError(initialize);

    const result = await service.process();

    new SuccessResponse(ApiMessage.OrderCalculated, result).send(res);
  }),
);

export default router;
