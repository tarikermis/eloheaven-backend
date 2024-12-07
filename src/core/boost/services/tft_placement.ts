import IOrder from '@database/models/Order';
import Joi from 'joi';
import { ExtraOption } from '@common/Order';
import { ICalculateResult, PriceLayer, PriceType } from '@common/Price';
import Boost, { GameCode, ServerCode, ServiceCode, IPayload } from '../Boost';
import { capitalize } from 'lodash';
import { safeFloat } from '@helpers/number';
import { TeamfightTactics_Tier } from '../games/TeamfightTactics';
import IRank from '@database/models/Rank';
import { BoostMessage } from '@common/BoostMessage';
import { BadRequestError } from '@core/ApiError';

//? Row Templates
//? placement = [ currentLeague ]

//! SCHEMA START
const schema = {
  general: Joi.object()
    .keys({
      current: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              TeamfightTactics_Tier.Unranked,
              TeamfightTactics_Tier.Iron,
              TeamfightTactics_Tier.Bronze,
              TeamfightTactics_Tier.Silver,
              TeamfightTactics_Tier.Gold,
              TeamfightTactics_Tier.Platinum,
              TeamfightTactics_Tier.Emerald,
              TeamfightTactics_Tier.Diamond,
              TeamfightTactics_Tier.Master,
              TeamfightTactics_Tier.Grandmaster,
              TeamfightTactics_Tier.Challenger,
            )
            .required(),
        })
        .required(),
      matchCount: Joi.number().integer().strict().min(1).max(5).required(),
      server: Joi.string()
        .valid(
          ServerCode.EUW,
          ServerCode.EUNE,
          ServerCode.NA,
          ServerCode.OCE,
          ServerCode.JP,
          ServerCode.KR,
          ServerCode.LAN,
          ServerCode.LAS,
          ServerCode.TR,
          ServerCode.RU,
          ServerCode.BR,
          ServerCode.MENA,
        )
        .required(),
    })
    .required(),
};
//! SCHEMA END

//! Don't export
interface IBoostPayload extends IPayload {
  general: {
    current: {
      tier: string;
      // ref
      rank: IRank;
    };
    matchCount: number;
    server: ServerCode;
  };
}

export default class TeamfightTactics_Placement extends Boost {
  private serverList; // server list

  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(
      GameCode.TeamfightTactics,
      ServiceCode.TeamfightTactics_Placement,
      payload,
      extended,
      [
        ExtraOption.AppearOffline,
        ExtraOption.PriorityOrder,
        ExtraOption.StreamGames,
        ExtraOption.DuoBoost,
        ExtraOption.VpnOn,
      ],
    );

    this.serverList = {
      [ServerCode.EUW]: 1,
      [ServerCode.EUNE]: 3,
      [ServerCode.NA]: 5,
      [ServerCode.OCE]: 7,
      [ServerCode.JP]: 9,
      [ServerCode.KR]: 11,
      [ServerCode.LAN]: 13,
      [ServerCode.LAS]: 15,
      [ServerCode.TR]: 17,
      [ServerCode.RU]: 19,
      [ServerCode.BR]: 21,
      [ServerCode.MENA]: 23,
      // bug fix
      [ServerCode.EU]: -1,
      [ServerCode.LATAM]: -1,
    };
  }

  public async process(): Promise<IOrder | ICalculateResult> {
    const payload: IBoostPayload = this.payload;
    const mainPrice = new PriceLayer('mainPrice', PriceType.Main);

    const serverIndex = this.serverList[payload.general.server];
    if (serverIndex === -1 || serverIndex === undefined)
      throw new BadRequestError(BoostMessage.InvalidServer);

    // duo server should be next to solo server
    // if (payload.extras.duoBoost) serverIndex += 1;

    const matchIndex = this.priceList.findIndex(
      ([_tier]) => _tier === payload.general.current.tier,
    );

    const price = safeFloat(this.priceList[matchIndex][serverIndex]);

    mainPrice.amount = price * payload.general.matchCount;

    //? Process price
    const calculateResult: ICalculateResult = await this.processPrice(
      mainPrice,
    );

    if (payload.checkout) {
      //* Ranks are used to specify orders.

      // Find Current Rank Filter
      const currentSearch = await this.findRank(
        payload.general.current.tier,
        1,
      );

      payload.general.current.rank = currentSearch._id;

      let orderTitle = ``;

      orderTitle += `${capitalize(payload.general.current.tier)} - `;
      orderTitle += `${payload.general.matchCount} Match`;
      orderTitle += ` | ${payload.general.server.toUpperCase()} | Placement`;

      const order = {
        title: orderTitle,
        details: {
          general: payload.general,
          extras: payload.extras,
        },
      };

      const createdOrder = await this.createOrder(
        order as any,
        calculateResult,
        {
          service: payload.service,
          server: payload.general.server,
        },
      );
      return createdOrder;
    } else {
      return calculateResult;
    }
  }
}
