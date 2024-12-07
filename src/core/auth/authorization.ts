import express from 'express';
import { IProtectedRequest } from 'app-request';
import { AuthFailureError } from '@core/ApiError';
import RoleRepo from '@repository/RoleRepo';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';

const router = express.Router();

export default router.use(
  asyncHandler(async (req: IProtectedRequest, res, next) => {
    if (!req.user || !req.user.role || !req.requiredPermissions)
      throw new AuthFailureError(ApiMessage.AccessDenied);

    const role = await RoleRepo.findByCode(req.user.role.code);
    if (!role) throw new AuthFailureError(ApiMessage.AccessDenied);

    const userPerms = req.user.role.permissions;
    const validRoles = req.requiredPermissions.filter((v) =>
      userPerms.includes(v),
    );

    if (!validRoles || validRoles.length == 0)
      throw new AuthFailureError(ApiMessage.AccessDenied);

    return next();
  }),
);
