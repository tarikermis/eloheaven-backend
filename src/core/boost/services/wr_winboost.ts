import IOrder from '@database/models/Order';
import Joi from 'joi';
import { ExtraOption } from '@common/Order';
import { ICalculateResult, PriceLayer, PriceType } from '@common/Price';
import Boost, { GameCode, ServerCode, ServiceCode, IPayload } from '../Boost';
import { capitalize } from 'lodash';
import { safeFloat } from '@helpers/number';
import { WildRift_Tier } from '../games/WildRift';
import IRank from '@database/models/Rank';
import { BoostMessage } from '@common/BoostMessage';
import { BadRequestError } from '@core/ApiError';

//? Row Templates
//? win_boost = [ currentLeague , currentDivision , eloEuwPrice , eloEunePrice , eloNaPrice , eloOtherPrice , duoEuwPrice , duoEunePrice , duoNaPrice , duoOtherPrice ]

//! SCHEMA START
const schema = {
  general: Joi.object()
    .keys({
      game: Joi.string().required(),
      current: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              WildRift_Tier.Iron,
              WildRift_Tier.Bronze,
              WildRift_Tier.Silver,
              WildRift_Tier.Gold,
              WildRift_Tier.Platinum,
              WildRift_Tier.Emerald,
              WildRift_Tier.Diamond,
              WildRift_Tier.Master,
              WildRift_Tier.Grandmaster,
              WildRift_Tier.Challenger,
            )
            .required(),
          division: Joi.number().integer().min(1).max(4).required(),
        })
        .required(),
      winCount: Joi.number().integer().strict().min(1).max(10).required(),
      server: Joi.string()
        .valid(ServerCode.EU, ServerCode.NA, ServerCode.RU, ServerCode.OCE)
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
      division: number;
      // ref
      rank: IRank;
    };
    winCount: number;
    server: ServerCode;
  };
}

export default class WildRift_WinBoost extends Boost {
  private serverList; // server list
  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(GameCode.WildRift, ServiceCode.WildRift_WinBoost, payload, extended, [
      ExtraOption.AppearOffline,
      ExtraOption.PriorityOrder,
      ExtraOption.StreamGames,
      ExtraOption.DuoBoost,
      ExtraOption.SoloOnly,
      ExtraOption.VpnOn,
      ExtraOption.PremiumDuoBoost,
    ]);

    this.serverList = {
      [ServerCode.EU]: 2,
      [ServerCode.NA]: 4,
      [ServerCode.RU]: 6,
      [ServerCode.OCE]: 8,
      // bug fix
      [ServerCode.EUW]: -1,
      [ServerCode.EUNE]: -1,
      [ServerCode.JP]: -1,
      [ServerCode.KR]: -1,
      [ServerCode.LAN]: -1,
      [ServerCode.LAS]: -1,
      [ServerCode.TR]: -1,
      [ServerCode.BR]: -1,
      [ServerCode.LATAM]: -1,
      [ServerCode.MENA]: -1,
    };
  }

  public async process(): Promise<IOrder | ICalculateResult> {
    const payload: IBoostPayload = this.payload;
    const mainPrice = new PriceLayer('mainPrice', PriceType.Main);

    // Update division to 4 on target league
    if (payload.general.current.tier === WildRift_Tier.Master)
      payload.general.current.division = 4;

    // use 4 as
    if (
      [
        WildRift_Tier.Master,
        WildRift_Tier.Grandmaster,
        WildRift_Tier.Challenger,
      ].includes(payload.general.current.tier as WildRift_Tier)
    ) {
      payload.general.current.division = 4;
    }

    const serverIndex = this.serverList[payload.general.server];
    if (serverIndex === -1 || serverIndex === undefined)
      throw new BadRequestError(BoostMessage.InvalidServer);

    // duo server should be next to solo server
    // if (payload.extras.duoBoost) serverIndex += 1;

    const matchIndex = this.priceList.findIndex(
      ([_tier, _division]) =>
        _tier === payload.general.current.tier &&
        _division === payload.general.current.division.toString(),
    );

    const price = safeFloat(this.priceList[matchIndex][serverIndex]);

    mainPrice.amount = price * payload.general.winCount;

    //? Process price
    const calculateResult: ICalculateResult = await this.processPrice(
      mainPrice,
    );

    if (payload.checkout) {
      //* Ranks are used to specify orders.

      // Find Current Rank Filter
      const currentSearch = await this.findRank(
        payload.general.current.tier,
        payload.general.current.division,
      );

      payload.general.current.rank = currentSearch._id;

      let orderTitle = ``;
      if (
        ![
          WildRift_Tier.Master,
          WildRift_Tier.Grandmaster,
          WildRift_Tier.Challenger,
        ].includes(payload.general.current.tier as WildRift_Tier)
      )
        orderTitle += `${capitalize(payload.general.current.tier)} ${
          payload.general.current.division
        } - `;
      else {
        orderTitle += `${capitalize(payload.general.current.tier)} - `;
        payload.general.current.division = 0;
      }
      orderTitle += `${payload.general.winCount} Match `;
      orderTitle += ` | ${payload.general.server.toUpperCase()} | Win Boost`;

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
