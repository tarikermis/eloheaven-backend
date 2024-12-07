import _ from 'lodash';
import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import UserRepo from '@database/repository/UserRepo';
import { Types } from 'mongoose';
import { BadRequestError } from '@core/ApiError';
import validator, { ValidationSource } from '@helpers/validator';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import { PermissionCode } from '@common/Permission';
import OrderRepo from '@database/repository/OrderRepo';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import TransactionRepo from '@database/repository/TransactionRepo';

const router = express.Router();

router.get(
  '/id/:id',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.userId, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(new Types.ObjectId(req.params.id));
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const response = _.pick(user, [
      'username',
      'email',
      'balance',
      'profilePicture',
      'role',
      'status',
      'emailVerified',
      'firstLoginIp',
      'lastLoginIp',
      'lastLoginAt',
      'updatedAt',
      'createdAt',
      'appear',
      'boosterDetails',
      'documents',
      'discordId',
      'profile',
    ]);

    return new SuccessResponse(ApiMessage.UserFound, {
      ...response,
    }).send(res);
  }),
);

router.post(
  '/id/:id/transactions',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.userId, ValidationSource.PARAM),
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(new Types.ObjectId(req.params.id));
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const query: any = {};
    query['user'] = user._id;
    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['description'] = { $regex: req.body.search, $options: 'i' };
    }

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      populate: {
        path: 'issuer',
        select: { _id: 1, username: 1 },
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
  '/id/:id/orders',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.userId, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(new Types.ObjectId(req.params.id));
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const orders = await OrderRepo.findByCustomer(user._id);

    return new SuccessResponse(ApiMessage.UserFound, orders).send(res);
  }),
);

router.post(
  '/id/:id/logs',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.userId, ValidationSource.PARAM),
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(new Types.ObjectId(req.params.id));
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const query: any = {};
    query['user'] = user._id;
    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['message'] = { $regex: req.body.search, $options: 'i' };
    }

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      populate: {
        path: 'user',
        select: { _id: 1, username: 1 },
      },
    };

    const logs = await AuditLogRepo.paginate(query, options);

    return new SuccessResponse(ApiMessage.UserFound, logs).send(res);
  }),
);

export default router;
