import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator from '@helpers/validator';
import schema from './_schema';
import { PermissionCode } from '@common/Permission';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import permissions from '@helpers/permissions';
import IRaffle from '@database/models/Raffle';
import { slugify } from '@helpers/string';
import { sha256 } from '@helpers/hash';
import { randomUUID } from 'crypto';
import RaffleRepo from '@database/repository/RaffleRepo';

const router = express.Router();

router.post(
  '/',
  permissions([PermissionCode.EditSystem]),
  authentication,
  authorization,
  validator(schema.createOrUpdate),
  asyncHandler(async (req: IRoleRequest, res) => {
    const raffle = {
      name: req.body.name,
      description: req.body.description,
      slug: slugify(req.body.name) + `-${sha256(req.body.name).slice(0, 7)}`,
      guid: randomUUID(),
      rewards: req.body.rewards,
      ticketCost: req.body.ticketCost,
      ticketCount: 0,
      status: req.body.status,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    } as IRaffle;

    const createdRaffle = await RaffleRepo.create(raffle);

    new SuccessResponse(ApiMessage.RaffleCreated, { ...createdRaffle }).send(
      res,
    );
  }),
);

export default router;
