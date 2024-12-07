import express from 'express';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';

import NotificationRepo from '@database/repository/NotificationRepo';

const router = express.Router();

router.post(
  '/',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const notifications = await NotificationRepo.findByUser(req.user);

    if (notifications) {
      for (const notification of notifications) {
        notification.seen = true;
        await NotificationRepo.updateInfo(notification);
      }
    }
    return new SuccessResponse(ApiMessage.Success, notifications).send(res);
  }),
);

export default router;
