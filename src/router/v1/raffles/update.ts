import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';
import schema from './_schema';
import { PermissionCode } from '@common/Permission';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import permissions from '@helpers/permissions';
import { BadRequestError } from '@core/ApiError';
import RaffleRepo from '@database/repository/RaffleRepo';

const router = express.Router();

router.put(
  '/:raffleId',
  permissions([PermissionCode.EditPosts]),
  authentication,
  authorization,
  validator(schema.createOrUpdate),
  validator(schema.raffleIdParam, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    const raffle = await RaffleRepo.findById(req.params.raffleId as any);

    if (!raffle) throw new BadRequestError(ApiMessage.RaffleNotFound);

    raffle.name = req.body.name;
    raffle.description = req.body.description;
    raffle.rewards = req.body.rewards;
    raffle.ticketCost = req.body.ticketCost;
    raffle.status = req.body.status;
    raffle.startTime = req.body.startTime;
    raffle.endTime = req.body.endTime;

    await RaffleRepo.updateInfo(raffle);

    new SuccessResponse(ApiMessage.RaffleUpdated).send(res);
  }),
);

export default router;
