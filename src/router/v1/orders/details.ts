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
import OrderRepo from '@database/repository/OrderRepo';
import RoleRepo from '@database/repository/RoleRepo';
import { ServiceCode } from '@core/boost/Boost';

const router = express.Router();

const pickList = [
  '_id',
  'orderId',
  'title',
  'game',
  'service',
  'totalPrice',
  'details',
  'coupon',
  'photos',
  'booster',
  'customer',
  'state',
  'credentials',
  'createdAt',
  'updatedAt',
];
// if you dont exclude the ordrs booster's cant see the credentials
const excludeOrds = [
  ServiceCode.LeagueOfLegends_EloBoost,
  ServiceCode.LeagueOfLegends_DuoBoost,
  ServiceCode.LeagueOfLegends_Placement,
  ServiceCode.LeagueOfLegends_WinBoost,
  ServiceCode.LeagueOfLegends_Coaching,
  ServiceCode.Valorant_EloBoost,
  ServiceCode.Valorant_DuoBoost,
  ServiceCode.Valorant_Placement,
  ServiceCode.Valorant_WinBoost,
  ServiceCode.Valorant_Coaching,
  ServiceCode.TeamfightTactics_EloBoost,
  ServiceCode.TeamfightTactics_DuoBoost,
  ServiceCode.TeamfightTactics_Placement,
  ServiceCode.TeamfightTactics_WinBoost,
  ServiceCode.TeamfightTactics_Coaching,
  ServiceCode.WildRift_EloBoost,
  ServiceCode.WildRift_DuoBoost,
  ServiceCode.WildRift_Placement,
  ServiceCode.WildRift_WinBoost,
];

router.get(
  '/id/:id',
  authentication,
  validator(schema.orderId, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(
      new Types.ObjectId(req.params.id),
      '+coupon +booster +customer +photos +credentials',
    );
    if (!order || !order.service)
      throw new BadRequestError(ApiMessage.OrderNotFound);

    const role = await RoleRepo.findById(req.user.role._id);

    if (!role) throw new BadRequestError(ApiMessage.RoleNotFound);

    const isCustomer = OrderRepo.isCustomer(order, req.user);
    const isAdmin = OrderRepo.isAdmin(req.user);
    const isBooster = OrderRepo.isBooster(order, req.user);

    if (isBooster) {
      order.totalPrice = UserRepo.calculateBoosterPrice(req.user, order);
    }

    const response = _.pick(order, pickList);

    if (isBooster && !excludeOrds.includes(order.service)) {
      _.unset(response, 'credentials.username');
      _.unset(response, 'credentials.password');
    }

    if (isAdmin || isCustomer || isBooster) {
      return new SuccessResponse(ApiMessage.OrderFound, response).send(res);
    } else {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }
  }),
);

router.get(
  '/order_num/:order_num',
  authentication,
  validator(schema.orderNum, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findByNum(
      req.params.order_num as any,
      '+coupon +booster +customer +photos +credentials',
    );
    if (!order || !order.service)
      throw new BadRequestError(ApiMessage.OrderNotFound);

    const role = await RoleRepo.findById(req.user.role._id);

    if (!role) throw new BadRequestError(ApiMessage.RoleNotFound);

    const isCustomer = OrderRepo.isCustomer(order, req.user);
    const isAdmin = OrderRepo.isAdmin(req.user);
    const isBooster = OrderRepo.isBooster(order, req.user);

    if (isBooster) {
      order.totalPrice = UserRepo.calculateBoosterPrice(req.user, order);
    }

    const response = _.pick(order, pickList);

    if (isBooster && !excludeOrds.includes(order.service)) {
      _.unset(response, 'credentials.username');
      _.unset(response, 'credentials.password');
    }

    if (isAdmin || isCustomer || isBooster) {
      return new SuccessResponse(ApiMessage.OrderFound, response).send(res);
    } else {
      throw new BadRequestError(ApiMessage.AccessDenied);
    }
  }),
);

export default router;
