import IOrder from '@database/models/Order';
import Joi from 'joi';
import { ExtraOption } from '@common/Order';
import { ICalculateResult, PriceLayer, PriceType } from '@common/Price';
import Boost, { GameCode, ServerCode, ServiceCode, IPayload } from '../Boost';
import { capitalize } from 'lodash';
import { safeFloat } from '@helpers/number';
import { Valorant_Tier } from '../games/Valorant';
import IRank from '@database/models/Rank';
import { BadRequestError } from '@core/ApiError';
import { BoostMessage } from '@common/BoostMessage';

//? Row Templates
//? placement = [ currentTier , currentDivision ,  eloEuPrice , eloNaPrice , eloOcePrice , eloOtherPrice , duoEuPrice , duoNaPrice , duoOcePrice , duoOtherPrice ]

//! SCHEMA START
const schema = {
  general: Joi.object()
    .keys({
      current: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              Valorant_Tier.Unranked,
              Valorant_Tier.Iron,
              Valorant_Tier.Bronze,
              Valorant_Tier.Silver,
              Valorant_Tier.Gold,
              Valorant_Tier.Platinum,
              Valorant_Tier.Diamond,
              Valorant_Tier.Ascendant,
              Valorant_Tier.Immortal,
              Valorant_Tier.Radiant,
            )
            .required(),
        })
        .required(),
      matchCount: Joi.number().integer().strict().min(1).max(10).required(),
      server: Joi.string()
        .valid(ServerCode.EU, ServerCode.NA, ServerCode.OCE, ServerCode.LATAM)
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

export default class Valorant_Placement extends Boost {
  private serverList; // server list
  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(
      GameCode.Valorant,
      ServiceCode.Valorant_Placement,
      payload,
      extended,
      [
        ExtraOption.AppearOffline,
        ExtraOption.CustomChampions,
        ExtraOption.PriorityOrder,
        ExtraOption.StreamGames,
        ExtraOption.DuoBoost,
        ExtraOption.SoloOnly,
        ExtraOption.VpnOn,
        ExtraOption.NoStack,
        ExtraOption.PremiumDuoBoost,
        ExtraOption.GhostBoost,
        ExtraOption.NormalizeScore,
      ],
    );

    this.serverList = {
      [ServerCode.EU]: 1,
      [ServerCode.NA]: 3,
      [ServerCode.OCE]: 5,
      [ServerCode.LATAM]: 7,
      // bug fix
      [ServerCode.EUW]: -1,
      [ServerCode.EUNE]: -1,
      [ServerCode.JP]: -1,
      [ServerCode.KR]: -1,
      [ServerCode.LAN]: -1,
      [ServerCode.LAS]: -1,
      [ServerCode.TR]: -1,
      [ServerCode.RU]: -1,
      [ServerCode.BR]: -1,
      [ServerCode.MENA]: -1,
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
        3,
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
