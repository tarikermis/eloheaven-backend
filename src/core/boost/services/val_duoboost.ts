import IOrder from '@database/models/Order';
import Joi from 'joi';
import { ExtraOption } from '@common/Order';
import { ICalculateResult, PriceLayer, PriceType } from '@common/Price';
import Boost, { GameCode, ServerCode, ServiceCode, IPayload } from '../Boost';
import { BadRequestError, InternalError } from '@core/ApiError';
import { BoostMessage } from '@common/BoostMessage';
import { capitalize } from 'lodash';
import { safeFloat } from '@helpers/number';
import { Valorant_RRC, Valorant_Tier } from '../games/Valorant';
import IRank from '@database/models/Rank';

//? Row Templates
//? duo_boost = [ currentLeague , currentDivision , targetLeague  , targetDivision  , rrCurrent , euPrice  , naPrice   , ocePrice   , otherPrice ]
//? irr_boost = [ rrRangeStart  , rrRangeEnd      , null          , null            , null      , euPrice  , naPrice   , ocePrice   , otherPrice ]

//! SCHEMA START
const schema = {
  general: Joi.object()
    .keys({
      game: Joi.string().required(),
      current: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              Valorant_Tier.Iron,
              Valorant_Tier.Bronze,
              Valorant_Tier.Silver,
              Valorant_Tier.Gold,
              Valorant_Tier.Platinum,
              Valorant_Tier.Diamond,
              Valorant_Tier.Ascendant,
              Valorant_Tier.Immortal,
            )
            .required(),
          division: Joi.number().integer().min(1).max(3).required(),
          rr: Joi.number().integer().min(0).max(1000),
        })
        .required(),
      target: Joi.object()
        .keys({
          tier: Joi.string()
            .valid(
              Valorant_Tier.Iron,
              Valorant_Tier.Bronze,
              Valorant_Tier.Silver,
              Valorant_Tier.Gold,
              Valorant_Tier.Platinum,
              Valorant_Tier.Diamond,
              Valorant_Tier.Ascendant,
              Valorant_Tier.Immortal,
            )
            .required(),
          division: Joi.number().integer().min(1).max(3).required(),
          rr: Joi.number().integer().min(0).max(1000),
        })
        .required(),
      server: Joi.string()
        .valid(ServerCode.EU, ServerCode.NA, ServerCode.OCE, ServerCode.LATAM)
        .required(),
      rrCurrent: Joi.string()
        .valid(
          Valorant_RRC.RR0_25,
          Valorant_RRC.RR26_50,
          Valorant_RRC.RR51_75,
          Valorant_RRC.RR76_100,
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
      rr: number;
    };
    target: {
      tier: string;
      division: number;
      // ref
      rank: IRank;
      rr: number;
    };
    rrCurrent: Valorant_RRC;
    server: ServerCode;
  };
}

export default class Valorant_DuoBoost extends Boost {
  // DUO BOOST
  private step; // sizeof Valorant_RRC
  private lastLeagueAt; // indexOf Immortal3

  private minDiff; // indexOf Immortal3

  private isDuoService; // is duo service
  private serverList; // server list

  constructor(payload: IBoostPayload, parentSchema: Joi.ObjectSchema) {
    const extended = parentSchema.keys(schema);
    super(GameCode.Valorant, ServiceCode.Valorant_DuoBoost, payload, extended, [
      ExtraOption.ExtraWin,
      ExtraOption.PriorityOrder,
      ExtraOption.PremiumDuoBoost,
      ExtraOption.GhostBoost,
    ]);

    this.step = 4;
    this.lastLeagueAt = 84;

    this.minDiff = 40;

    this.isDuoService = true;
    this.serverList = {
      [ServerCode.EU]: 5,
      [ServerCode.NA]: 6,
      [ServerCode.OCE]: 7,
      [ServerCode.LATAM]: 8,
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
    const currentIndex = Object.values(Valorant_Tier).indexOf(
      payload.general.current.tier as Valorant_Tier,
    );
    const targetIndex = Object.values(Valorant_Tier).indexOf(
      payload.general.target.tier as Valorant_Tier,
    );

    // Update division to 3 on target tier
    if (payload.general.target.tier === Valorant_Tier.Immortal)
      payload.general.target.division = 1;

    const serverIndex = this.serverList[payload.general.server];
    if (serverIndex === -1 || serverIndex === undefined)
      throw new BadRequestError(BoostMessage.InvalidServer);

    // current tier is not immortal
    // so, include elo boost price calculation
    if (payload.general.current.tier !== Valorant_Tier.Immortal) {
      const startIndex = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _rr]) =>
          _ct === payload.general.current.tier &&
          _cd === payload.general.current.division.toString() &&
          _rr === payload.general.rrCurrent,
      );

      let firstStep = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _rr], i) =>
          i > startIndex && _rr === Valorant_RRC.RR0_25,
      );

      const lastStep = this.priceList.findIndex(
        ([_ct, _cd, _tt, _td, _rr], i) =>
          _tt === payload.general.target.tier &&
          _td === payload.general.target.division.toString() &&
          _rr === Valorant_RRC.RR0_25,
      );

      if (firstStep === -1) firstStep = this.lastLeagueAt;

      if (currentIndex > targetIndex) {
        throw new BadRequestError(
          BoostMessage.TargetTierCannotBeLessThanCurrentTier,
        );
      }

      if (
        currentIndex === targetIndex &&
        payload.general.current.division >= payload.general.target.division &&
        payload.general.current.tier !== Valorant_Tier.Immortal
      ) {
        throw new BadRequestError(
          BoostMessage.TargetDivisionCannotBeSameOrLessThanCurrentDivision,
        );
      }
      mainPrice.amount += safeFloat(this.priceList[startIndex][serverIndex]);

      // Duo boost
      for (let i = firstStep; i <= lastStep; i += this.step) {
        mainPrice.amount += safeFloat(this.priceList[i][serverIndex]);
      }
    }
    //! dont ask for 1rr
    const crr =
      payload.general.current.tier === Valorant_Tier.Immortal
        ? Number(payload.general.current.rr)
        : 0;
    const trr =
      payload.general.target.tier === Valorant_Tier.Immortal
        ? Number(payload.general.target.rr)
        : 0;

    // RR Boost
    if (trr >= 0) {
      const diff = trr - crr;
      if (
        diff < this.minDiff &&
        payload.general.current.tier === Valorant_Tier.Immortal
      ) {
        throw new BadRequestError(BoostMessage.RRDiffMustBeGreaterThanMinDiff);
      }
      for (let i = crr; i < trr; i++) {
        const priceCell = this.priceList.findIndex(
          ([_rrMin, _rrMax]) => i >= Number(_rrMin) && i <= Number(_rrMax),
        );

        if (!priceCell) throw new InternalError();

        mainPrice.amount += safeFloat(this.priceList[priceCell][serverIndex]);
      }
    }

    //? Process extra win
    if (payload.extras.extraWin === true) {
      await this.processExtraWin(
        ServiceCode.Valorant_WinBoost,
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
      } (${payload.general.rrCurrent}) - `;

      orderTitle += `${capitalize(payload.general.target.tier)} ${
        payload.general.target.tier !== Valorant_Tier.Immortal
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
