import Joi from 'joi';
import { JoiObjectId } from '@helpers/validator';
import { ServiceCode } from '@core/boost/Boost';
import { LeagueOfLegends_Lane } from '@core/boost/games/LeagueOfLegends';

export default {
  process: Joi.object().keys({
    general: Joi.object().required(),
    extras: Joi.object()
      .keys({
        duoBoost: Joi.boolean().strict(),
        soloOnly: Joi.boolean().strict(),
        appearOffline: Joi.boolean().strict(),
        streamGames: Joi.boolean().strict(),
        priorityOrder: Joi.boolean().strict(),
        extraWin: Joi.boolean().strict(),
        vpnOn: Joi.boolean().strict(),
        noStack: Joi.boolean().strict(),
        premiumDuoBoost: Joi.boolean().strict(),
        lowLpGain: Joi.boolean().strict(),
        ghostBoost: Joi.boolean().strict(),
        normalizeScore: Joi.boolean().strict(),
        customFlash: Joi.string().valid('D', 'F'),
        customLanes: Joi.object().keys({
          primary: Joi.string()
            .valid(
              LeagueOfLegends_Lane.TOP,
              LeagueOfLegends_Lane.JUNGLE,
              LeagueOfLegends_Lane.MIDDLE,
              LeagueOfLegends_Lane.ADC,
              LeagueOfLegends_Lane.SUPPORT,
              '', // enable empty
            )
            .required(),
          secondary: Joi.string()
            .valid(
              LeagueOfLegends_Lane.TOP,
              LeagueOfLegends_Lane.JUNGLE,
              LeagueOfLegends_Lane.MIDDLE,
              LeagueOfLegends_Lane.ADC,
              LeagueOfLegends_Lane.SUPPORT,
              '', // enable empty
            )
            .required(),
        }),
        customChampions: Joi.array().items(Joi.string()),
      })
      .required(),
    coupon: Joi.string().allow(''),
    booster: JoiObjectId().allow(''),
    service: Joi.string()
      .required()
      .valid(
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
    checkout: Joi.boolean().strict(),
  }),
  coaching: Joi.object().keys({
    coach: JoiObjectId().required(),
    service: Joi.string()
      .required()
      .valid(
        ServiceCode.LeagueOfLegends_Coaching,
        ServiceCode.Valorant_Coaching,
        ServiceCode.TeamfightTactics_Coaching,
        ServiceCode.WildRift_Coaching,
      ),
    hours: Joi.number().integer().strict().min(1).max(4).required(),
  }),
  careers: Joi.object().keys({
    name: Joi.string().max(64).required(),
    email: Joi.string().email().required(),
    discord: Joi.string().max(20).required(),
    game: Joi.string()
      .required()
      .valid('League of Legends', 'Valorant', 'Teamfight Tactics', 'Wild Rift'),
    message: Joi.string().max(1024).required(),
    captchaResponse: Joi.string().required(),
    servers: Joi.array().items(Joi.string().valid('NA', 'EU', 'OCE')),
  }),
};
