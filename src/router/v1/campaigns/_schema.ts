import { ServiceCode } from '@core/boost/Boost';
import Joi from 'joi';

export default {
  services: Joi.object().keys({
    service: Joi.string()
      .required()
      .valid(
        ServiceCode.LeagueOfLegends_EloBoost,
        ServiceCode.LeagueOfLegends_DuoBoost,
        ServiceCode.LeagueOfLegends_Placement,
        ServiceCode.LeagueOfLegends_WinBoost,
        ServiceCode.Valorant_EloBoost,
        ServiceCode.Valorant_DuoBoost,
        ServiceCode.Valorant_Placement,
        ServiceCode.Valorant_WinBoost,
        ServiceCode.TeamfightTactics_EloBoost,
        ServiceCode.TeamfightTactics_DuoBoost,
        ServiceCode.TeamfightTactics_Placement,
        ServiceCode.TeamfightTactics_WinBoost,
        ServiceCode.WildRift_EloBoost,
        ServiceCode.WildRift_DuoBoost,
        ServiceCode.WildRift_Placement,
        ServiceCode.WildRift_WinBoost,
      ),
  }),
};
