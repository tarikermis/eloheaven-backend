import express from 'express';
import schema from './_schema';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import RaffleRepo from '@database/repository/RaffleRepo';
import validator from '@helpers/validator';
import authentication from '@core/auth/authentication';

const router = express.Router();

router.post(
  '/',
  authentication,
  validator(schema.list),
  asyncHandler(async (req: IRoleRequest, res) => {
    //? Build query
    const query: any = {};

    if (req.body.search && req.body.search.length > 0)
      query['$or'] = [{ name: { $regex: req.body.search, $options: 'i' } }];

    const options = {
      limit: req.body.limit,
      page: req.body.page,
    };
    const result = await RaffleRepo.paginate(query, options);

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
