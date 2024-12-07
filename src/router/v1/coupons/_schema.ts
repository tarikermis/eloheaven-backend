import { IncreaseType } from '@common/Price';
import { ServiceCode } from '@core/boost/Boost';
import { JoiObjectId } from '@helpers/validator';
import Joi from 'joi';
export default {
  createOrUpdate: Joi.object().keys({
    code: Joi.string().max(16).required(),
    discount: Joi.number().strict().min(0).max(100).required(),
    type: Joi.string()
      .valid(IncreaseType.Percentage, IncreaseType.Direct)
      .required(),
    scope: Joi.array()
      .items(
        Joi.string().valid(
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
          ServiceCode.WildRift_Coaching,
        ),
      )
      .required(),
    limit: Joi.number().integer().strict().min(0).max(1000000).required(),
    autoApply: Joi.boolean().strict().required(),
    expireAt: Joi.date().required(),
  }),
  couponIdParam: Joi.object().keys({
    couponId: JoiObjectId().required(),
  }),
};
