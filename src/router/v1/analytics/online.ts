import express from 'express';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import authentication from '@core/auth/authentication';
import { PermissionCode } from '@common/Permission';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import RoleRepo from '@database/repository/RoleRepo';
import { BadRequestError } from '@core/ApiError';
import UserRepo from '@database/repository/UserRepo';
const router = express.Router();

router.get(
  '/:role',
  permissions([PermissionCode.EditUsers, PermissionCode.Booster]),
  authentication,
  authorization,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const roleParam = req.params.role;
    const role = await RoleRepo.findByCode(roleParam);

    if (!role) throw new BadRequestError(ApiMessage.BadRequest);

    //? Build query
    const query: any = {};
    query['role'] = role._id;
    query['appear'] = 'online';

    const options = {
      limit: 10000,
      page: 1,
      select: '_id username profilePicture boosterDetails.vip',
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
