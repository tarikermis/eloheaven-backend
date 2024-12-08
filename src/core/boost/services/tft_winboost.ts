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
          division: Joi.number().integer().min(1).max(4).required(),
        })
        .required(),
      winCount: Joi.number().integer().strict().min(1).max(10).required(),
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
      division: number;
      // ref
      rank: IRank;
    };
    winCount: number;
    server: ServerCode;
  };
}

export default class TeamfightTactics_WinBoost extends Boost {
  private serverList; // server list

  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(
      GameCode.TeamfightTactics,
      ServiceCode.TeamfightTactics_WinBoost,
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
      [ServerCode.EUW]: 2,
      [ServerCode.EUNE]: 4,
      [ServerCode.NA]: 6,
      [ServerCode.OCE]: 8,
      [ServerCode.JP]: 10,
      [ServerCode.KR]: 12,
      [ServerCode.LAN]: 14,
      [ServerCode.LAS]: 16,
      [ServerCode.TR]: 18,
      [ServerCode.RU]: 20,
      [ServerCode.BR]: 22,
      [ServerCode.MENA]: 24,
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

    // use 4 as
    if (
      [
        TeamfightTactics_Tier.Master,
        TeamfightTactics_Tier.Grandmaster,
        TeamfightTactics_Tier.Challenger,
      ].includes(payload.general.current.tier as TeamfightTactics_Tier)
    ) {
      payload.general.current.division = 4;
      if (payload.extras.duoBoost) {
        throw new BadRequestError(
          BoostMessage.DuoBoostIsNotAvailableForThisService,
        );
      }
    }

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
          TeamfightTactics_Tier.Master,
          TeamfightTactics_Tier.Grandmaster,
          TeamfightTactics_Tier.Challenger,
        ].includes(payload.general.current.tier as TeamfightTactics_Tier)
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
