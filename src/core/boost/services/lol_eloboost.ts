import IOrder from '@database/models/Order';
import Joi from 'joi';
import { ExtraOption } from '@common/Order';
import { ICalculateResult, PriceLayer, PriceType } from '@common/Price';
import Boost, { GameCode, ServerCode, ServiceCode, IPayload } from '../Boost';
import { BadRequestError, InternalError } from '@core/ApiError';
import { BoostMessage } from '@common/BoostMessage';
import { capitalize } from 'lodash';
import {
  LeagueOfLegends_Gain,
  LeagueOfLegends_LPC,
  LeagueOfLegends_QueueType,
  LeagueOfLegends_Tier,
} from '../games/LeagueOfLegends';
import IRank from '@database/models/Rank';
import { safeFloat, safePercent } from '@helpers/number';

//? Row Templates
//? elo_boost = [ currentLeague , currentDivision , targetLeague  , targetDivision  , lpCurrent ]
//? mlp_boost = [ lpGain        , lpRangeStart    , lpRangeEnd    , null            , null      ]

//! SCHEMA START
const schema = {
  general: Joi.object()
    .keys({
      current: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              LeagueOfLegends_Tier.Iron,
              LeagueOfLegends_Tier.Bronze,
              LeagueOfLegends_Tier.Silver,
              LeagueOfLegends_Tier.Gold,
              LeagueOfLegends_Tier.Platinum,
              LeagueOfLegends_Tier.Emerald,
              LeagueOfLegends_Tier.Diamond,
              LeagueOfLegends_Tier.Master,
            )
            .required(),
          division: Joi.number().integer().min(1).max(4).required(),
          lp: Joi.number().integer().min(0).max(1000).required(),
        })
        .required(),
      target: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              LeagueOfLegends_Tier.Iron,
              LeagueOfLegends_Tier.Bronze,
              LeagueOfLegends_Tier.Silver,
              LeagueOfLegends_Tier.Gold,
              LeagueOfLegends_Tier.Platinum,
              LeagueOfLegends_Tier.Emerald,
              LeagueOfLegends_Tier.Diamond,
              LeagueOfLegends_Tier.Master,
            )
            .required(),
          division: Joi.number().integer().min(1).max(4).required(),
          lp: Joi.number().integer().min(0).max(1000).required(),
        })
        .required(),
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
      lpCurrent: Joi.string()
        .valid(
          LeagueOfLegends_LPC.LP0_20,
          LeagueOfLegends_LPC.LP21_40,
          LeagueOfLegends_LPC.LP41_60,
          LeagueOfLegends_LPC.LP61_80,
          LeagueOfLegends_LPC.LP81_100,
        )
        .required(),
      lpGain: Joi.string()
        .valid(
          LeagueOfLegends_Gain.LP36P,
          LeagueOfLegends_Gain.LP31_35,
          LeagueOfLegends_Gain.LP26_30,
          LeagueOfLegends_Gain.LP21_25,
          LeagueOfLegends_Gain.LP16_20,
          LeagueOfLegends_Gain.LP1_15,
        )
        .required(),
      queueType: Joi.string()
        .valid(
          LeagueOfLegends_QueueType.SOLO_DUO,
          LeagueOfLegends_QueueType.FLEX,
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
      lp: number;
      // ref
      rank: IRank;
    };
    target: {
      tier: string;
      division: number;
      lp: number;
      // ref
      rank: IRank;
    };
    lpCurrent: LeagueOfLegends_LPC;
    lpGain: LeagueOfLegends_Gain;
    server: ServerCode;
    queueType: LeagueOfLegends_QueueType;
  };
}

export default class LeagueOfLegends_EloBoost extends Boost {
  // ELO BOOST
  private step; // sizeof LeagueOfLegends_LPC
  private lastLeagueAt; // indexOf Master4

  // LP BOOST
  private minDiff; //lp boost min diff

  private isDuoService; // is duo service
  private lpGainTable; // lp gain table for process
  private serverList; // server list

  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(
      GameCode.LeagueOfLegends,
      ServiceCode.LeagueOfLegends_EloBoost,
      payload,
      extended,
      [
        ExtraOption.AppearOffline,
        ExtraOption.CustomChampions,
        ExtraOption.CustomFlash,
        ExtraOption.CustomLanes,
        ExtraOption.ExtraWin,
        ExtraOption.PriorityOrder,
        ExtraOption.StreamGames,
        ExtraOption.SoloOnly,
        ExtraOption.VpnOn,
        ExtraOption.LowLpGain,
        ExtraOption.NormalizeScore,
      ],
    );

    this.step = 5;
    this.lastLeagueAt = 140;

    this.minDiff = 40;

    this.isDuoService = false;
    this.lpGainTable = {
      [LeagueOfLegends_Gain.LP1_15]: 65,
      [LeagueOfLegends_Gain.LP16_20]: 52,
      [LeagueOfLegends_Gain.LP21_25]: 39,
      [LeagueOfLegends_Gain.LP26_30]: 26,
      [LeagueOfLegends_Gain.LP31_35]: 13,
      [LeagueOfLegends_Gain.LP36P]: 0,
    };

    this.serverList = {
      [ServerCode.EUW]: 5,
      [ServerCode.EUNE]: 6,
      [ServerCode.NA]: 7,
      [ServerCode.OCE]: 8,
      [ServerCode.JP]: 9,
      [ServerCode.KR]: 10,
      [ServerCode.LAN]: 11,
      [ServerCode.LAS]: 12,
      [ServerCode.TR]: 13,
      [ServerCode.RU]: 14,
      [ServerCode.BR]: 15,
      [ServerCode.MENA]: 16,
      // bug fix
      [ServerCode.EU]: -1,
      [ServerCode.LATAM]: -1,
    };
  }

  public async process(): Promise<IOrder | ICalculateResult> {
    const payload: IBoostPayload = this.payload;
    const mainPrice = new PriceLayer('mainPrice', PriceType.Main);

    const currentIndex = Object.values(LeagueOfLegends_Tier).indexOf(
      payload.general.current.tier as LeagueOfLegends_Tier,
    );
    const targetIndex = Object.values(LeagueOfLegends_Tier).indexOf(
      payload.general.target.tier as LeagueOfLegends_Tier,
    );

    // Update division to 4 on target league
    if (payload.general.current.tier === LeagueOfLegends_Tier.Master)
      payload.general.current.division = 4;

    // Update division to 4 on target league
    if (payload.general.target.tier === LeagueOfLegends_Tier.Master)
      payload.general.target.division = 4;

    const serverIndex = this.serverList[payload.general.server];
    if (serverIndex === -1 || serverIndex === undefined)
      throw new BadRequestError(BoostMessage.InvalidServer);

    if (payload.general.current.tier !== LeagueOfLegends_Tier.Master) {
      // current tier is not master
      // so, include elo boost price calculation
      const startIndex = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _lp]) =>
          _ct === payload.general.current.tier &&
          _cd === payload.general.current.division.toString() &&
          _lp === payload.general.lpCurrent,
      );

      let firstStep = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _lp], i) =>
          i > startIndex && _lp === LeagueOfLegends_LPC.LP0_20,
      );

      const lastStep = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _lp], i) =>
          _tt === payload.general.target.tier &&
          _td === payload.general.target.division.toString() &&
          _lp === LeagueOfLegends_LPC.LP0_20,
      );

      if (firstStep === -1) firstStep = this.lastLeagueAt;

      if (currentIndex > targetIndex) {
        throw new BadRequestError(
          BoostMessage.TargetTierCannotBeLessThanCurrentTier,
        );
      }

      if (
        currentIndex === targetIndex &&
        payload.general.current.division <= payload.general.target.division &&
        payload.general.current.tier !== LeagueOfLegends_Tier.Master
      ) {
        throw new BadRequestError(
          BoostMessage.TargetDivisionCannotBeSameOrLessThanCurrentDivision,
        );
      }

      mainPrice.amount += safeFloat(this.priceList[startIndex][serverIndex]);

      // Elo boost
      for (let i = firstStep; i <= lastStep; i += this.step) {
        mainPrice.amount += safeFloat(this.priceList[i][serverIndex]);
      }

      mainPrice.amount +=
        mainPrice.amount *
        safePercent(this.lpGainTable[payload.general.lpGain]);
    }

    const clp =
      payload.general.current.tier === LeagueOfLegends_Tier.Master
        ? Number(payload.general.current.lp)
        : 0;
    const tlp =
      payload.general.target.tier === LeagueOfLegends_Tier.Master
        ? Number(payload.general.target.lp)
        : 0;

    // LP Boost
    if (tlp >= 0) {
      const diff = tlp - clp;
      if (
        diff < this.minDiff &&
        payload.general.current.tier === LeagueOfLegends_Tier.Master
      ) {
        throw new BadRequestError(BoostMessage.LPDiffMustBeGreaterThanMinDiff);
      }

      for (let i = clp; i < tlp; i++) {
        const priceCell = this.priceList.findIndex(
          ([_lp, _lpMin, _lpMax]) =>
            _lp === payload.general.lpGain &&
            i >= Number(_lpMin) &&
            i <= Number(_lpMax),
        );

        if (!priceCell) throw new InternalError();

        mainPrice.amount += safeFloat(this.priceList[priceCell][serverIndex]);
      }
    }

    //? Process extra win
    if (payload.extras.extraWin === true) {
      await this.processExtraWin(
        ServiceCode.LeagueOfLegends_WinBoost,
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
        payload.general.current.lp,
      );

      payload.general.current.rank = currentSearch._id;

      // Find Target Rank Filter
      const targetSearch = await this.findRank(
        payload.general.target.tier,
        payload.general.target.division,
        payload.general.target.lp,
      );

      payload.general.target.rank = targetSearch._id;

      let orderTitle = ``;

      if (clp > 0) {
        orderTitle += `${capitalize(
          payload.general.current.tier,
        )} ${clp} LP - `;
      } else {
        orderTitle += `${capitalize(payload.general.current.tier)} ${
          payload.general.current.division
        } (${payload.general.lpCurrent}) - `;
      }
      if (tlp > 0) {
        orderTitle += `${capitalize(payload.general.target.tier)} ${tlp} LP`;
      } else {
        orderTitle += `${capitalize(payload.general.target.tier)} ${
          payload.general.target.tier !== LeagueOfLegends_Tier.Master
            ? payload.general.target.division
            : ''
        }`;
      }
      orderTitle += ` | ${payload.general.server.toUpperCase()} | Elo Boost`;

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
