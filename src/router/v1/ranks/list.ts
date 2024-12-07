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
import RankRepo from '@database/repository/RankRepo';
import validator, { ValidationSource } from '@helpers/validator';

const router = express.Router();

router.get(
  '/',
  permissions([PermissionCode.EditSystem, PermissionCode.Booster]),
  authentication,
  authorization,
  // validation is not required because we are using static limit, page values.
  // validator(schema.list, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};

    const options = {
      limit: 1000,
      page: 1,
    };

    const result = await RankRepo.paginate(query, options);

    return new SuccessResponse(ApiMessage.Success, result.docs).send(res);
  }),
);

router.get(
  '/:game',
  permissions([PermissionCode.EditSystem, PermissionCode.Booster]),
  authentication,
  authorization,
  validator(schema.gameRanks, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const query: any = {};
    query['game'] = req.params.game;

    const options = {
      limit: 1000,
      page: 1,
    };

    const result = await RankRepo.paginate(query, options);

    return new SuccessResponse(ApiMessage.Success, result.docs).send(res);
  }),
);

export default router;
