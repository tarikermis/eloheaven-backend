import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import { Types } from 'mongoose';
import validator, { ValidationSource } from '@helpers/validator';
import RaffleTicketRepo from '@database/repository/RaffleTicketRepo';
import RaffleRepo from '@database/repository/RaffleRepo';

const router = express.Router();

router.get(
  '/:raffleId',
  permissions([PermissionCode.EditPosts]),
  authentication,
  authorization,
  validator(schema.raffleIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const result = await RaffleRepo.findById(
      new Types.ObjectId(req.params.raffleId),
    );

    return new SuccessResponse(ApiMessage.Success, result).send(res);
  }),
);

router.get(
  '/:raffleId/tickets',
  permissions([PermissionCode.EditPosts]),
  authentication,
  authorization,
  validator(schema.raffleIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};
    query['raffle'] = new Types.ObjectId(req.params.raffleId);

    const options = {
      limit: 1000,
      page: 1,
      populate: {
        path: 'user',
        select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
      },
    };

    const result = await RaffleTicketRepo.paginate(query, options);

    return new SuccessResponse(ApiMessage.Success, result).send(res);
  }),
);

export default router;
