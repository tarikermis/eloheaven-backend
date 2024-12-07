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
import AuditLogRepo from '@database/repository/AuditLogRepo';
import { LogScope } from '@database/models/AuditLog';
import authentication from '@core/auth/authentication';
import OrderRepo from '@database/repository/OrderRepo';

const router = express.Router();

router.post(
  '/',
  authentication,
  validator(schema.process),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const serviceFilePath = path.resolve(
      __dirname + '../../../../core/boost/services/' + req.body.service + '.js',
    );

    if (!existsSync(serviceFilePath))
      throw new BadRequestError(ApiMessage.ServiceNotFound);

    const serviceFile = await import(serviceFilePath);

    // checkout
    const payload = req.body;
    payload.checkout = true;

    const service = new serviceFile.default(payload, schema.process);
    const initialize = await service.init();
    if (initialize !== true) throw new BadRequestError(initialize);

    const result = await service.process();

    const order = await OrderRepo.findById(result._id);
    if (!order) throw new BadRequestError(ApiMessage.SomethingWrong);

    order.customer = req.user;

    if (req.user.gclid) {
      order.gclid = req.user.gclid;
    }
    await OrderRepo.updateInfo(order);

    await AuditLogRepo.insert(
      `Order #${result.orderId} has been created. IP: ${req.ipAddress}`,
      LogScope.Order,
    );

    new SuccessResponse(ApiMessage.OrderCreated, result).send(res);
  }),
);

export default router;
