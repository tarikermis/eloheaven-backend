import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';

import NotificationRepo from '@database/repository/NotificationRepo';

const router = express.Router();

router.get(
  '/',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const notifications = await NotificationRepo.findByUser(req.user);
    return new SuccessResponse(ApiMessage.Success, notifications).send(res);
  }),
);

router.put(
  '/:id',
  authentication,
  validator(schema.notification, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const notification = await NotificationRepo.findById(req.params.id);

    if (notification) {
      notification.seen = true;
      await NotificationRepo.updateInfo(notification);
    }

    return new SuccessResponse(ApiMessage.Success).send(res);
  }),
);

router.delete(
  '/:id',
  authentication,
  validator(schema.notification, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const notification = await NotificationRepo.findById(req.params.id);

    if (notification) await NotificationRepo.delete(notification);

    return new SuccessResponse(ApiMessage.Success).send(res);
  }),
);

export default router;
