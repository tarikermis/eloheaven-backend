import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import validator from '@helpers/validator';
import { toSafeInteger } from 'lodash';
import UserRepo from '@database/repository/UserRepo';
import { BadRequestError } from '@core/ApiError';
import { GameCode, ServiceCode } from '@core/boost/Boost';
import ServiceRepo from '@database/repository/ServiceRepo';
import IOrder from '@database/models/Order';
import { IncreaseType, PriceLayer, PriceType } from '@common/Price';
import { IExtraOptions, IOrderDetails } from '@common/Order';
import OrderRepo from '@database/repository/OrderRepo';
import { realValue, safeInt } from '@helpers/number';
import authentication from '@core/auth/authentication';

const router = express.Router();

router.post(
  '/',
  authentication,
  validator(schema.coaching),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const hours = toSafeInteger(req.body.hours);
    const coach = await UserRepo.findById(req.body.coach);
    if (!coach || !coach.boosterDetails || !coach.profile)
      throw new BadRequestError(ApiMessage.CoachNotFound);

    let gameCode = GameCode.LeagueOfLegends;
    switch (req.body.service) {
      case ServiceCode.LeagueOfLegends_Coaching:
        gameCode = GameCode.LeagueOfLegends;
        break;
      case ServiceCode.Valorant_Coaching:
        gameCode = GameCode.Valorant;
        break;
      case ServiceCode.TeamfightTactics_Coaching:
        gameCode = GameCode.TeamfightTactics;
        break;
      case ServiceCode.WildRift_Coaching:
        gameCode = GameCode.WildRift;
        break;
      default:
        throw new BadRequestError(ApiMessage.ServiceNotFound);
    }

    const price = safeInt(
      hours * realValue(coach.boosterDetails.coachingPrice),
    );

    //! Game doesnt exists on profile.games
    if (!coach.profile.games.includes(gameCode))
      throw new BadRequestError(ApiMessage.CoachNotEligible);

    const filter = await ServiceRepo.findFilterWithoutServer(req.body.service);
    if (!filter) throw new BadRequestError(ApiMessage.ServiceFilterNotFound);

    const summary: PriceLayer[] = [];
    summary.push({
      amount: price,
      label: 'mainPrice',
      priceType: PriceType.Main,
      increaseType: IncreaseType.Direct,
    });

    const details: IOrderDetails = {
      general: {
        sessionTime: hours,
      },
      extras: [] as IExtraOptions,
      summary,
    };

    const order = {
      title: `${filter.title} | ${coach.username} (${hours} hours)`,
      game: gameCode,
      service: req.body.service as ServiceCode,
      filter: filter,
      totalPrice: price,
      details,
      booster: coach._id,
      customer: req.user._id,
    } as IOrder;

    const result = await OrderRepo.create(
      order,
      order.booster ? false : true, // chat message
    );

    return new SuccessResponse(ApiMessage.Success, result).send(res);
  }),
);

export default router;
