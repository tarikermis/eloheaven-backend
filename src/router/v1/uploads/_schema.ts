import Joi from 'joi';
import { ServiceCode } from '@core/boost/Boost';

export default {
  orderNum: Joi.object().keys({
    order_num: Joi.number().integer().min(1).max(100000000).required(),
  }),
  tag: Joi.object().keys({
    tag: Joi.string().valid('back', 'front', 'first', 'second', 'third'),
  }),
  priceList: Joi.object().keys({
    service: Joi.string().valid(
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
  }),
};
