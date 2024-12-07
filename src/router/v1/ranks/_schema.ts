import Joi from 'joi';
import { GameCode } from '@core/boost/Boost';

export default {
  list: Joi.object().keys({
    limit: Joi.number().integer().min(10).max(500).required(),
    page: Joi.number().integer().min(1).required(),
    search: Joi.string().allow(''),
  }),
  gameRanks: Joi.object().keys({
    game: Joi.string()
      .allow(
        GameCode.LeagueOfLegends,
        GameCode.Valorant,
        GameCode.TeamfightTactics,
        GameCode.WildRift,
      )
      .required(),
  }),
};
