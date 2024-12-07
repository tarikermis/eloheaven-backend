import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import { BadRequestError } from '@core/ApiError';
import validator, { ValidationSource } from '@helpers/validator';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import { PermissionCode } from '@common/Permission';
import OrderRepo from '@database/repository/OrderRepo';
import { OrderState } from '@database/models/Order';
import UserRepo from '@database/repository/UserRepo';
import { notificationCooldown } from '@config';
import { verifyCaptchaV2 } from '@helpers/captcha';
import ChatRepo from '@database/repository/ChatRepo';
const router = express.Router();

router.post(
  '/claim',
  permissions([PermissionCode.Booster]),
  authentication,
  authorization,
  validator(schema.claimOrder),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const verify = await verifyCaptchaV2(req.body.captchaResponse);
    if (!verify) throw new BadRequestError(ApiMessage.InvalidCaptcha);

    const order = await OrderRepo.findById(req.body.id);
    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const claimed = await OrderRepo.claimBoost(req.user, order);

    if (!claimed) throw new BadRequestError(ApiMessage.SomethingWrong);

    return new SuccessResponse(ApiMessage.BoostClaimed, {
      order: order.id,
      booster: req.user._id,
    }).send(res);
  }),
);

router.post(
  '/finish',
  permissions([PermissionCode.Booster]),
  authentication,
  authorization,
  validator(schema.orderId),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const order = await OrderRepo.findById(req.body.id);
    if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

    const isBooster = await OrderRepo.isBooster(order, req.user);
    if (!isBooster) throw new BadRequestError(ApiMessage.BoosterNotFound);

    if (order.state !== OrderState.Boosting)
      throw new BadRequestError(ApiMessage.SomethingWrong);

    order.flagTime = new Date();
    order.DeletionFlag = true;
    await OrderRepo.updateFlag(order);
    order.state = OrderState.VerificationRequired;
    await OrderRepo.updateInfo(order);
    await ChatRepo.createSystemMsg(
      order,
      "Your order with eloheaven is now complete! We hope you're satisfied with our service. Could you spare a moment to leave us a review? We'd greatly appreciate your thoughts at https://www.trustpilot.com/evaluate/eloheaven.gg . Thank you for your support!",
    );
    return new SuccessResponse(ApiMessage.BoostFinishedWaitForVerification, {
      order: order.id,
      booster: req.user._id,
    }).send(res);
  }),
);

router.post(
  '/:state',
  permissions([PermissionCode.Booster]),
  authentication,
  authorization,
  validator(schema.list),
  validator(schema.stateForBoosters, ValidationSource.PARAM),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const orderList = [];
    const user = await UserRepo.findById(req.user._id);

    if (!user || !user.boosterDetails || !user.boosterDetails.services)
      throw new BadRequestError(ApiMessage.AccessDenied);

    const userFilters = user.boosterDetails.services.map((service) =>
      service.filter._id.toString(),
    );

    // prepare query
    const query: any = {};
    const options = {
      limit: req.body.limit,
      page: req.body.page,
      select: '-details.summary',
      populate: {
        path: 'customer',
        select: { _id: 1, username: 1, profilePicture: 1, createdAt: 1 },
      },
    };

    switch (req.params.state) {
      case 'available-orders':
        query['state'] = OrderState.WaitingForBooster;
        query['filter'] = { $in: userFilters };

        let time = Date.now();
        if (!user.boosterDetails.vip) {
          time -= parseInt(notificationCooldown.toString()) * 1000;
        }
        const searchDate = new Date(time); // in ms

        query['startedAt'] = { $lte: searchDate };
        break;
      case 'active-orders':
        query['state'] = {
          $in: [OrderState.Boosting, OrderState.VerificationRequired],
        };
        query['booster'] = req.user._id;
        break;
      case 'completed-orders':
        query['state'] = OrderState.Completed;
        query['booster'] = req.user._id;
        options.select = '-details.summary -totalPrice +boosterPrice';
        break;
      default:
        throw new BadRequestError(ApiMessage.AccessDenied);
    }

    const searchAsNumber = Number(req.body.search);

    //? Search by title
    if (req.body.search && req.body.search.length > 0) {
      query['$or'] = [{ title: { $regex: req.body.search, $options: 'i' } }];

      // Include orderId to query
      if (!isNaN(searchAsNumber))
        query['$or'].push({ orderId: Number(req.body.search) });
    }

    const result = await OrderRepo.paginate(query, options);

    for (const order of result.docs) {
      if (req.params.state === 'completed-orders') {
        if (order.boosterPrice) {
          order.totalPrice = order.boosterPrice;
          orderList.push(order);
        } else {
          order.totalPrice = -1; // TODO: check for reports (if we get reports like 'my earning shows as -1')
        }
      } else {
        const calcPrice = UserRepo.calculateBoosterPrice(user, order);
        if (calcPrice <= 0) {
          console.log('**************calcPrice <= 0**************');
          break;
        }

        order.totalPrice = calcPrice;
        orderList.push(order);
      }
    }

    const response = {
      page: result.page,
      docs: orderList,
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
