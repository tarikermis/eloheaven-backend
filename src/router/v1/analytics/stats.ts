import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import authentication from '@core/auth/authentication';
import { PermissionCode } from '@common/Permission';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import OrderRepo from '@database/repository/OrderRepo';
import UserRepo from '@database/repository/UserRepo';
import TransactionRepo from '@database/repository/TransactionRepo';
const router = express.Router();

router.get(
  '/',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  asyncHandler(async (req: IRoleRequest, res) => {
    const orders = await OrderRepo.getStats();
    const users = await UserRepo.getStats();
    const transactions = await TransactionRepo.getStats();
    return new SuccessResponse(ApiMessage.Success, {
      orders,
      users,
      transactions,
    }).send(res);
  }),
);

router.get(
  '/orders',
  permissions([PermissionCode.EditOrders]),
  authentication,
  authorization,
  asyncHandler(async (req: IRoleRequest, res) => {
    const orders = await OrderRepo.getStats();
    return new SuccessResponse(ApiMessage.Success, {
      orders,
    }).send(res);
  }),
);

export default router;
