import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import validator, { ValidationSource } from '@helpers/validator';
import OrderRepo from '@database/repository/OrderRepo';
import { OrderState } from '@database/models/Order';

const router = express.Router();

router.post(
  '/:scope',
  authentication,
  validator(schema.userOrderScope, ValidationSource.PARAM),
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};
    query['customer'] = req.user._id;

    // TODO: add more scopes (such as completed, all etc.)
    //? Include order.state when scope is on-going
    if (req.params.scope === 'on-going') {
      query['state'] = {
        $in: [
          OrderState.Boosting,
          OrderState.WaitingForAccount,
          OrderState.WaitingForBooster,
          OrderState.VerificationRequired,
        ],
      };
    }

    const searchAsNumber = Number(req.body.search);

    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['$or'] = [{ title: { $regex: req.body.search, $options: 'i' } }];

      //? Include orderId to query
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
          select: { _id: 1, username: 1, profilePicture: 1, appear: 1 },
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
