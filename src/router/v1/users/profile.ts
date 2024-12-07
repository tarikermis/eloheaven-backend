import _ from 'lodash';
import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import UserRepo from '@database/repository/UserRepo';
import { BadRequestError } from '@core/ApiError';
import validator, { ValidationSource } from '@helpers/validator';

const router = express.Router();

const fields = [
  '_id',
  'username',
  'appear',
  'profile',
  'profilePicture',
  'boosterDetails.vip',
  'boosterDetails.coach',
  'boosterDetails.coachingPrice',
  'boosterDetails.assignable',
];

router.get(
  '/id/:id',
  validator(schema.userId, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findPublicProfile(req.params.id, 'id');
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);
    return new SuccessResponse(ApiMessage.UserFound, _.pick(user, fields)).send(
      res,
    );
  }),
);

router.get(
  '/username/:username',
  validator(schema.username, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findPublicProfile(
      req.params.username,
      'username',
    );
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);
    return new SuccessResponse(ApiMessage.UserFound, _.pick(user, fields)).send(
      res,
    );
  }),
);

export default router;
