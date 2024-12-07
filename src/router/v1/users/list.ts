import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import UserRepo from '@database/repository/UserRepo';
import { BadRequestError } from '@core/ApiError';
import validator from '@helpers/validator';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import RoleRepo from '@database/repository/RoleRepo';

const router = express.Router();

router.post(
  '/boosters/search',
  validator(schema.boosterSearch),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const role = await RoleRepo.findByCode('booster');
    if (!role) throw new BadRequestError(ApiMessage.BadRequest);

    //? Build query
    const query: any = {};
    query['role'] = role._id;
    query['status'] = true;
    if (req.body.vip) query['boosterDetails.vip'] = true;
    if (req.body.coach) query['boosterDetails.coach'] = true;
    if (req.body.assignable) query['boosterDetails.assignable'] = true;
    if (req.body.online) query['appear'] = 'online';
    if (req.body.games && req.body.games.length > 0)
      query['profile.games'] = { $in: req.body.games };
    if (req.body.languages && req.body.languages.length > 0)
      query['profile.languages'] = {
        $in: req.body.languages.map((lang: string) => lang.toLowerCase()),
      };

    //? Search by username
    if (req.body.search && req.body.search.length > 0)
      query['username'] = { $regex: req.body.search, $options: 'i' };

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      sort: { 'boosterDetails.vip': -1, createdAt: 1 }, //todo: req.body.vip (if required)
      select:
        '_id username appear profile profilePicture boosterDetails.vip boosterDetails.coach boosterDetails.coachingPrice',
    };

    const result = await UserRepo.paginate(query, options);

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
  '/:role',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.list),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const roleParam = req.params.role;
    const role = await RoleRepo.findByCode(roleParam);

    if (!role) throw new BadRequestError(ApiMessage.BadRequest);

    //? Build query
    const query: any = {};
    query['role'] = role._id;

    //? Search by username
    if (req.body.search && req.body.search.length > 0)
      query['$or'] = [
        { username: { $regex: req.body.search, $options: 'i' } },
        { email: { $regex: req.body.search, $options: 'i' } },
      ];

    const options = {
      limit: req.body.limit,
      page: req.body.page,
      select: '_id username email balance appear createdAt',
    };
    const result = await UserRepo.paginate(query, options);

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
