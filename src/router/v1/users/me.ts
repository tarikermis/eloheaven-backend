import _ from 'lodash';
import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import UserRepo from '@database/repository/UserRepo';
import TransactionRepo from '@database/repository/TransactionRepo';
import validator from '@helpers/validator';
import RaffleRepo from '@database/repository/RaffleRepo';
import RaffleTicketRepo from '@database/repository/RaffleTicketRepo';
import { BadRequestError } from '@core/ApiError';

const router = express.Router();

router.get(
  '/',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.user._id, true);

    if (user && user.lastLoginIp && user.lastLoginIp === '0.0.0.0') {
      user.lastLoginIp = req.ipAddress;
      await UserRepo.updateInfo(user);
    }

    const raff = await RaffleRepo.findLastActive();
    let search = null;
    if (user && raff) search = await RaffleTicketRepo.findTickets(user, raff);

    const pick = _.pick(user, [
      '_id',
      'username',
      'email',
      'balance',
      'profilePicture',
      'role',
      'emailVerified',
      'lastLoginAt',
      'appear',
      'boosterDetails',
      'profile',
      'discordId',
      'documents',
      'consent',
      'createdAt',
    ]);

    // Remove admin note at @me
    _.unset(pick, 'boosterDetails.adminNote');

    new SuccessResponse(ApiMessage.UserFound, {
      user: {
        ...pick,
        ticketCount: search ? search.value : 0,
      },
    }).send(res);
  }),
);

router.post(
  '/transactions',
  authentication,
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.user._id);

    const query: any = {};
    query['user'] = user?._id;

    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['description'] = { $regex: req.body.search, $options: 'i' };
    }

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      populate: {
        path: 'issuer',
        select: { _id: 1, username: 1, profilePicture: 1 },
      },
    };

    const result = await TransactionRepo.paginate(query, options);

    const response = {
      page: result.page,
      docs: result.docs,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
    };

    return new SuccessResponse(ApiMessage.Success, response).send(res);
  }),
);

router.get(
  '/raffle-tickets',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.user._id);
    const raff = await RaffleRepo.findLastActive();
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);
    if (!raff) throw new BadRequestError(ApiMessage.RaffleNotFound);

    const result = await RaffleTicketRepo.findTickets(user, raff);

    return new SuccessResponse(ApiMessage.Success, {
      activeRaffle: result,
      raffleInfo: raff,
    }).send(res);
  }),
);

export default router;
