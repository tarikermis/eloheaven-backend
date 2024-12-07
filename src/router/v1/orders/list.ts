import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import OrderRepo from '@database/repository/OrderRepo';
import UserRepo from '@database/repository/UserRepo';
const router = express.Router();

router.post(
  '/:state',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.listOnlyState, ValidationSource.PARAM),
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};
    query['state'] = req.params.state;

    const searchAsNumber = Number(req.body.search);

    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['$or'] = [{ title: { $regex: req.body.search, $options: 'i' } }];

      const user = await UserRepo.findByUsername(req.body.search);
      if (user) {
        query['$or'].push({ booster: user._id });
        query['$or'].push({ customer: user._id });
      }

      // Include orderId to query
      if (!isNaN(searchAsNumber))
        query['$or'].push({ orderId: Number(req.body.search) });
    }

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      select: '+booster +customer',
      populate: [
        {
          path: 'booster',
          select: {
            _id: 1,
            username: 1,
            profilePicture: 1,
            appear: 1,
            createdAt: 1,
          },
        },
        {
          path: 'customer',
          select: {
            _id: 1,
            username: 1,
            profilePicture: 1,
            appear: 1,
            createdAt: 1,
          },
        },
      ],
    };

    const result = await OrderRepo.paginate(query, options);

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

router.post(
  '/:game/:state',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  validator(schema.listGameState, ValidationSource.PARAM),
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};
    query['game'] = req.params.game;
    query['state'] = req.params.state;

    const searchAsNumber = Number(req.body.search);

    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['$or'] = [{ title: { $regex: req.body.search, $options: 'i' } }];

      // Include orderId to query
      if (!isNaN(searchAsNumber))
        query['$or'].push({ orderId: Number(req.body.search) });
    }

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      select: '+booster +customer',
      populate: [
        {
          path: 'booster',
          select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
        },
        {
          path: 'customer',
          select: {
            _id: 1,
            username: 1,
            profilePicture: 1,
            appear: 1,
            createdAt: 1,
          },
        },
      ],
    };

    const result = await OrderRepo.paginate(query, options);

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

export default router;
