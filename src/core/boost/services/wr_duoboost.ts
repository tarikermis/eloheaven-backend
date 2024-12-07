import IOrder from '@database/models/Order';
import Joi from 'joi';
import { ExtraOption } from '@common/Order';
import { ICalculateResult, PriceLayer, PriceType } from '@common/Price';
import Boost, { GameCode, ServerCode, ServiceCode, IPayload } from '../Boost';
import { BadRequestError } from '@core/ApiError';
import { BoostMessage } from '@common/BoostMessage';
import { capitalize } from 'lodash';
import { safeFloat } from '@helpers/number';
import { WildRift_Tier } from '../games/WildRift';
import IRank from '@database/models/Rank';

//? Row Templates
//? elo_boost = [ currentLeague , currentDivision , targetLeague  , targetDivision  , mark  , euwPrice  , eunePrice , naPrice , otherPrice ]

//! SCHEMA START
const schema = {
  general: Joi.object()
    .keys({
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
            )
            .required(),
          division: Joi.number().integer().min(1).max(4).required(),
          mark: Joi.number().integer().min(0).max(6).required(),
        })
        .required(),
      target: Joi.object()
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
            )
            .required(),
          division: Joi.number().integer().min(1).max(4).required(),
        })
        .required(),
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
      mark: number;
      // ref
      rank: IRank;
    };
    target: {
      tier: string;
      division: number;
      // ref
      rank: IRank;
    };
    server: ServerCode;
  };
}

export default class WildRift_DuoBoost extends Boost {
  // ELO BOOST
  private lastLeagueAt; // indexOf Master4

  // LP BOOST
  // private minDiff; //lp boost min diff

  private markColumn;

  private isDuoService; // is duo service
  private serverList; // server list

  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(GameCode.WildRift, ServiceCode.WildRift_DuoBoost, payload, extended, [
      ExtraOption.ExtraWin,
      ExtraOption.PriorityOrder,
      ExtraOption.PremiumDuoBoost,
    ]);

    this.markColumn = 4;
    this.lastLeagueAt = 120;

    // this.minDiff = 20;

    this.isDuoService = true;
    this.serverList = {
      [ServerCode.EU]: 5,
      [ServerCode.NA]: 6,
      [ServerCode.RU]: 7,
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

    const currentIndex = Object.values(WildRift_Tier).indexOf(
      payload.general.current.tier as WildRift_Tier,
    );
    const targetIndex = Object.values(WildRift_Tier).indexOf(
      payload.general.target.tier as WildRift_Tier,
    );

    // Update division to 4 on target league
    if (payload.general.target.tier === WildRift_Tier.Master)
      payload.general.target.division = 4;

    const serverIndex = this.serverList[payload.general.server];
    if (serverIndex === -1 || serverIndex === undefined)
      throw new BadRequestError(BoostMessage.InvalidServer);

    // current tier is not master
    // so, include elo boost price calculation
    if (payload.general.current.tier !== WildRift_Tier.Master) {
      const startIndex = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _mark]) =>
          _ct === payload.general.current.tier &&
          _cd === payload.general.current.division.toString() &&
          _mark === payload.general.current.mark.toString(),
      );

      const lastStep = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _mark], i) =>
          _tt === payload.general.target.tier &&
          _td === payload.general.target.division.toString() &&
          _mark === '0',
      );

      if (currentIndex > targetIndex) {
        throw new BadRequestError(
          BoostMessage.TargetTierCannotBeLessThanCurrentTier,
        );
      }

      if (
        currentIndex === targetIndex &&
        payload.general.current.division <= payload.general.target.division &&
        payload.general.current.tier !== WildRift_Tier.Master
      ) {
        throw new BadRequestError(
          BoostMessage.TargetDivisionCannotBeSameOrLessThanCurrentDivision,
        );
      }

      mainPrice.amount += safeFloat(this.priceList[startIndex][serverIndex]);

      // Duo boost
      const firstloop = false;
      for (let i = startIndex; i <= lastStep; i++) {
        if (i > startIndex && this.priceList[i][this.markColumn] === '0') {
          mainPrice.amount += safeFloat(this.priceList[i][serverIndex]);
        }
      }
    }

    // const clp =
    //   payload.general.current.tier === WildRift_Tier.Master
    //     ? payload.general.current.lp
    //     : 0;
    // const tlp =
    //   payload.general.target.tier === WildRift_Tier.Master
    //     ? payload.general.target.lp
    //     : 0;

    // // LP Boost
    // if (tlp >= 0) {
    //   const diff = tlp - clp;
    //   if (
    //     diff < this.minDiff &&
    //     payload.general.current.tier === WildRift_Tier.Master
    //   ) {
    //     throw new BadRequestError(BoostMessage.LPDiffMustBeGreaterThanMinDiff);
    //   }
    //   for (let i = clp; i < tlp; i++) {
    //     const priceCell = this.priceList.findIndex(
    //       ([_lp, _lpMin, _lpMax]) =>
    //         _lp === payload.general.lpGain &&
    //         i >= Number(_lpMin) &&
    //         i <= Number(_lpMax),
    //     );

    //     mainPrice.amount += safeFloat(this.priceList[priceCell][serverIndex]);
    //   }
    // }

    //? Process extra win
    if (payload.extras.extraWin === true) {
      await this.processExtraWin(
        ServiceCode.WildRift_WinBoost,
        payload.general.target.tier,
        payload.general.target.division,
        payload.general.server,
        this.isDuoService, // duo
      );
    }

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

      // Find Target Rank Filter
      const targetSearch = await this.findRank(
        payload.general.target.tier,
        payload.general.target.division,
      );

      payload.general.target.rank = targetSearch._id;

      let orderTitle = ``;

      orderTitle += `${capitalize(payload.general.current.tier)} ${
        payload.general.current.division
      } (${payload.general.current.mark} Mark) - `;

      orderTitle += `${capitalize(payload.general.target.tier)} ${
        payload.general.target.tier !== WildRift_Tier.Master
          ? payload.general.target.division
          : ''
      }`;
      orderTitle += ` | ${payload.general.server.toUpperCase()} | Duo Boost`;

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
