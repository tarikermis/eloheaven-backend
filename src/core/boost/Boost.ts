import { ApiMessage } from '@common/ApiMessage';
import { BoostMessage } from '@common/BoostMessage';
import { ExtraOption, IExtraOptions, IOrderDetails } from '@common/Order';
import { PermissionCode } from '@common/Permission';
import {
  ICalculateResult,
  IncreaseType,
  PriceLayer,
  PriceType,
} from '@common/Price';
import { BadRequestError } from '@core/ApiError';
import Logger from '@core/Logger';
import agentsList from '@data/agents.json';
import championList from '@data/champions.json';
import ICoupon from '@database/models/Coupon';
import IOrder from '@database/models/Order';
import IRank from '@database/models/Rank';
import IUser from '@database/models/User';
import CouponRepo from '@database/repository/CouponRepo';
import OrderRepo from '@database/repository/OrderRepo';
import RankRepo from '@database/repository/RankRepo';
import RoleRepo from '@database/repository/RoleRepo';
import ServiceRepo from '@database/repository/ServiceRepo';
import UserRepo from '@database/repository/UserRepo';
import { realValue, safeFloat, safeInt, safePercent } from '@helpers/number';
import Joi from 'joi';
import _ from 'lodash';
import { Types } from 'mongoose';

import { LeagueOfLegends_Tier } from './games/LeagueOfLegends';
import { TeamfightTactics_Tier } from './games/TeamfightTactics';
import { Valorant_Tier } from './games/Valorant';
import { WildRift_Tier } from './games/WildRift';

export const enum GameCode {
  Unknown = 'unknown',
  LeagueOfLegends = 'league-of-legends',
  Valorant = 'valorant',
  TeamfightTactics = 'teamfight-tactics',
  WildRift = 'wild-rift',
}

export const enum ServiceCode {
  LeagueOfLegends_EloBoost = 'lol_eloboost',
  LeagueOfLegends_DuoBoost = 'lol_duoboost',
  LeagueOfLegends_Placement = 'lol_placement',
  LeagueOfLegends_WinBoost = 'lol_winboost',
  LeagueOfLegends_Coaching = 'lol_coaching',
  Valorant_EloBoost = 'val_eloboost',
  Valorant_DuoBoost = 'val_duoboost',
  Valorant_Placement = 'val_placement',
  Valorant_WinBoost = 'val_winboost',
  Valorant_Coaching = 'val_coaching',
  TeamfightTactics_EloBoost = 'tft_eloboost',
  TeamfightTactics_DuoBoost = 'tft_duoboost',
  TeamfightTactics_Placement = 'tft_placement',
  TeamfightTactics_WinBoost = 'tft_winboost',
  TeamfightTactics_Coaching = 'tft_coaching',
  WildRift_EloBoost = 'wr_eloboost',
  WildRift_DuoBoost = 'wr_duoboost',
  WildRift_Placement = 'wr_placement',
  WildRift_WinBoost = 'wr_winboost',
  WildRift_Coaching = 'wr_coaching',
}

export const enum ServerCode {
  EUW = 'euw',
  EUNE = 'eune',
  NA = 'na',
  OCE = 'oce',
  JP = 'jp',
  KR = 'kr',
  LAN = 'lan',
  LAS = 'las',
  TR = 'tr',
  RU = 'ru',
  BR = 'br',
  // + region
  EU = 'eu',
  LATAM = 'latam',
  MENA = 'mena',
}

export const ExtraOptionPrice: PriceLayer | any = {
  [ExtraOption.AppearOffline]: new PriceLayer(
    ExtraOption.AppearOffline,
    PriceType.Extra,
    IncreaseType.Direct,
    0,
  ),
  [ExtraOption.StreamGames]: new PriceLayer(
    ExtraOption.StreamGames,
    PriceType.Extra,
    IncreaseType.Percentage,
    10,
  ),
  [ExtraOption.PriorityOrder]: new PriceLayer(
    ExtraOption.PriorityOrder,
    PriceType.Extra,
    IncreaseType.Percentage,
    20,
  ),
  [ExtraOption.CustomFlash]: new PriceLayer(
    ExtraOption.CustomFlash,
    PriceType.Extra,
    IncreaseType.Direct,
    0,
  ),
  [ExtraOption.CustomLanes]: new PriceLayer(
    ExtraOption.CustomLanes,
    PriceType.Extra,
    IncreaseType.Direct,
    0,
  ),
  // 1 champion price
  ['custom_champions_premium']: new PriceLayer(
    ExtraOption.CustomChampions,
    PriceType.Extra,
    IncreaseType.Percentage,
    0,
  ),
  // 1+ champion price
  [ExtraOption.CustomChampions]: new PriceLayer(
    ExtraOption.CustomChampions,
    PriceType.Extra,
    IncreaseType.Percentage,
    0,
  ),
  [ExtraOption.DuoBoost]: new PriceLayer(
    ExtraOption.DuoBoost,
    PriceType.Extra,
    IncreaseType.Percentage,
    50,
  ),
  [ExtraOption.SoloOnly]: new PriceLayer(
    ExtraOption.SoloOnly,
    PriceType.Extra,
    IncreaseType.Percentage,
    40,
  ),
  [ExtraOption.VpnOn]: new PriceLayer(
    ExtraOption.VpnOn,
    PriceType.Extra,
    IncreaseType.Direct,
    0,
  ),
  [ExtraOption.NoStack]: new PriceLayer(
    ExtraOption.NoStack,
    PriceType.Extra,
    IncreaseType.Percentage,
    25,
  ),
  [ExtraOption.PremiumDuoBoost]: new PriceLayer(
    ExtraOption.PremiumDuoBoost,
    PriceType.Extra,
    IncreaseType.Percentage,
    25,
  ),
  [ExtraOption.LowLpGain]: new PriceLayer(
    ExtraOption.LowLpGain,
    PriceType.Extra,
    IncreaseType.Percentage,
    25,
  ),
  [ExtraOption.NormalizeScore]: new PriceLayer(
    ExtraOption.NormalizeScore,
    PriceType.Extra,
    IncreaseType.Percentage,
    40,
  ),
  [ExtraOption.GhostBoost]: new PriceLayer(
    ExtraOption.GhostBoost,
    PriceType.Extra,
    IncreaseType.Percentage,
    50,
  ),
};

export interface IPayload {
  extras: IExtraOptions;
  booster: Types.ObjectId;
  coupon: string;
  service: string;
  checkout: boolean;
}

export default class Boost {
  priceList: string[][] = [];
  resultPrice = 0;
  orderDetails: IOrderDetails = {
    general: {},
    extras: {},
    summary: [],
  };

  /**
   * @param payload request body
   * @param schema joi schema for validation
   * @param extraOptions available extra options
   * @param priceLayers default price layers
   * @param coupons enable/disable coupon codes
   */
  constructor(
    protected game: GameCode,
    protected service: ServiceCode,
    protected payload: any,
    protected schema: Joi.ObjectSchema,
    protected extraOptions: ExtraOption[] = [],
    protected priceLayers: PriceLayer[] = [],
    protected coupons: boolean = true,
  ) {}

  /**
   * Receives the price list and validates the payload
   */
  async init(): Promise<boolean | string> {
    const res = await ServiceRepo.find(this.payload.service);
    if (!res) throw new BadRequestError(ApiMessage.ServiceNotFound);

    this.priceList = res.data;

    return this.validate();
  }

  /**
   * Receives the price list and validates the payload
   */
  validate(): boolean | string {
    try {
      const { error } = this.schema.validate(this.payload);

      if (!error) return true;

      const { details } = error;
      const message = details
        .map((i) => i.message.replace(/['"]+/g, ''))
        .join(',');

      Logger.error(message);
      return message;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }

  /**
   * Processes the priceLayers by extra options
   */
  async processPrice(mainPrice: PriceLayer): Promise<ICalculateResult> {
    const buffer: ICalculateResult = {
      layers: this.priceLayers,
      total: 0,
      totalWithoutDiscount: 0,
    };
    const payload: IPayload = this.payload;

    mainPrice.amount = safeInt(mainPrice.amount);
    this.priceLayers.unshift(mainPrice); // put mainprice at top
    // extra options
    for (const extra of this.extraOptions) {
      switch (extra) {
        case ExtraOption.AppearOffline:
          if (payload.extras.appearOffline === true) {
            this.orderDetails.extras.appearOffline = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.StreamGames:
          if (payload.extras.streamGames === true) {
            this.orderDetails.extras.streamGames = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.PriorityOrder:
          if (payload.extras.priorityOrder === true) {
            this.orderDetails.extras.priorityOrder = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.DuoBoost:
          if (payload.extras.duoBoost === true) {
            this.orderDetails.extras.duoBoost = true;
            this.orderDetails.extras.soloOnly = false;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.SoloOnly:
          if (payload.extras.soloOnly === true) {
            this.orderDetails.extras.soloOnly = true;
            this.orderDetails.extras.duoBoost = false;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.NoStack:
          if (payload.extras.noStack === true) {
            this.orderDetails.extras.noStack = true;
            this.orderDetails.extras.duoBoost = false;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.ExtraWin:
          //! Process inside child.
          break;
        case ExtraOption.CustomFlash:
          if (payload.extras.customFlash !== undefined) {
            this.orderDetails.extras.customFlash = payload.extras.customFlash;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.CustomLanes:
          if (payload.extras.customLanes !== undefined) {
            this.orderDetails.extras.customLanes = payload.extras.customLanes;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.VpnOn:
          if (payload.extras.vpnOn === true) {
            this.orderDetails.extras.vpnOn = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.PremiumDuoBoost:
          if (payload.extras.premiumDuoBoost === true) {
            this.orderDetails.extras.premiumDuoBoost = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.LowLpGain:
          if (payload.extras.lowLpGain === true) {
            this.orderDetails.extras.lowLpGain = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.CustomChampions:
          if (
            payload.extras.customChampions !== undefined &&
            payload.extras.customChampions.length
          ) {
            switch (this.game) {
              case GameCode.LeagueOfLegends:
                const champions = championList.map((x) => x.id);
                if (
                  !payload.extras.customChampions.every((x) =>
                    champions.includes(x),
                  )
                ) {
                  throw new BadRequestError(
                    BoostMessage.CorruptedCustomChampionsPayload,
                  );
                }
                break;
              case GameCode.Valorant:
                const agents = agentsList.map((x) => x.id);
                if (
                  !payload.extras.customChampions.every((x) =>
                    agents.includes(x),
                  )
                ) {
                  throw new BadRequestError(
                    BoostMessage.CorruptedCustomChampionsPayload,
                  );
                }
                break;

              default:
                throw new BadRequestError(
                  BoostMessage.CustomChampionsOptionIsNotAvailable,
                );
            }

            this.orderDetails.extras.customChampions =
              payload.extras.customChampions;
            if (payload.extras.customChampions.length === 1)
              this.priceLayers.push(
                ExtraOptionPrice['custom_champions_premium'],
              );
            else this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.NormalizeScore:
          if (payload.extras.normalizeScore === true) {
            this.orderDetails.extras.normalizeScore = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
        case ExtraOption.GhostBoost:
          if (payload.extras.ghostBoost === true) {
            this.orderDetails.extras.ghostBoost = true;
            this.priceLayers.push(ExtraOptionPrice[extra]);
          }
          break;
      }
    }

    // apply coupon
    const coupon = await CouponRepo.findByCode(payload.coupon);
    if (coupon && coupon.scope.includes(payload.service as ServiceCode)) {
      buffer.coupon = {
        _id: coupon._id,
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
      } as ICoupon;
      this.priceLayers.push(
        new PriceLayer(
          'couponDiscount',
          PriceType.Discount,
          coupon.type,
          // We use safeInt, because direct values are not represented with safeInt. example: 5 (not 500)
          coupon.type === IncreaseType.Percentage
            ? coupon.discount
            : safeInt(coupon.discount),
        ),
      );
    }

    // user permission & booster details must be checked at
    if (payload.booster.toString().length === 24) {
      const booster = await UserRepo.findById(
        payload.booster as Types.ObjectId,
      );
      if (!booster) throw new BadRequestError(ApiMessage.BoosterNotFound);

      const displayBooster = _.pick(booster, [
        '_id',
        'username',
        'profilePicture',
        'appear',
      ]);

      const role = await RoleRepo.findById(booster.role._id);

      if (!role) throw new BadRequestError(ApiMessage.BoosterNotFound);
      if (!role.permissions.includes(PermissionCode.Booster))
        throw new BadRequestError(ApiMessage.BoosterNotFound);

      if (!booster.boosterDetails?.assignable)
        throw new BadRequestError(ApiMessage.BoosterNotAvailable);

      if (booster) {
        buffer.booster = displayBooster as unknown as IUser;
      }
    }

    let layerIndex = 0;
    for (const priceLayer of this.priceLayers) {
      const main = this.priceLayers.filter(
        (x) => x.priceType === PriceType.Main,
      )[0];

      switch (priceLayer.priceType) {
        case PriceType.Main:
          buffer.total += main.amount;
          break;
        case PriceType.Extra:
          if (priceLayer.increaseType == IncreaseType.Direct) {
            buffer.total += priceLayer.amount;
          } else {
            buffer.total +=
              safeFloat(main.amount) * safePercent(priceLayer.amount);
          }
          break;
        case PriceType.Discount:
          buffer.totalWithoutDiscount = buffer.total;
          if (priceLayer.increaseType == IncreaseType.Direct) {
            buffer.total -= priceLayer.amount;
          } else {
            buffer.total -=
              safeFloat(buffer.total) * safePercent(priceLayer.amount);
          }
          break;
      }
      layerIndex++;
    }

    if (buffer.total < 0) buffer.total = 0;

    //? Fixed precision
    buffer.total = safeInt(realValue(buffer.total));
    buffer.totalWithoutDiscount = safeInt(
      realValue(buffer.totalWithoutDiscount),
    );
    this.orderDetails.summary = buffer.layers;

    return buffer;
  }

  public async processExtraWin(
    service: ServiceCode,
    tier: string,
    division: number,
    serverName: ServerCode,
    duo: boolean,
  ) {
    const payload: IPayload = this.payload;
    if (payload.extras.extraWin === true) {
      const search = await ServiceRepo.find(service as string);
      if (search) {
        let find_server = search.data[0].findIndex((value) =>
          value.includes(serverName.toUpperCase()),
        );

        if (find_server === -1 || find_server === undefined)
          throw new BadRequestError(BoostMessage.InvalidServer);

        // duo server should be next to solo server
        if (duo) find_server += 1;

        // disable winboost on master+
        const excluded = ['master', 'grandmaster', 'challenger', 'immortal'];
        if (excluded.includes(tier)) return;

        const index = search.data.findIndex(
          ([_tier, _division]) =>
            _tier === tier && _division === division.toString(),
        );

        const price = safeInt(search.data[index][find_server]);

        if (price <= 0) return;

        //? extraWin included at here
        this.orderDetails.extras.extraWin = payload.extras.extraWin;

        this.priceLayers.push({
          label: ExtraOption.ExtraWin,
          priceType: PriceType.Extra,
          amount: price, // we already multiply by 100 => processPrice
          increaseType: IncreaseType.Direct,
        });
      }
    }
  }

  /**
   * Inserts the order to database.
   * TODO: Handle order details and run notification mechanism (discord, websocket)
   */
  public async createOrder(
    order: IOrder,
    calculateResult: ICalculateResult,
    serviceSearch: { service: string; server: string },
  ) {
    if (calculateResult.total <= 0)
      throw new BadRequestError(ApiMessage.SomethingWrong);

    // serviceSearch is defined
    if (!!serviceSearch) {
      const service_filter = await ServiceRepo.findFilter(
        serviceSearch.service,
        serviceSearch.server,
      );
      if (!service_filter)
        throw new BadRequestError(ApiMessage.ServiceFilterNotFound);

      // Set service filter
      order.filter = service_filter;
    }

    //? Prepare order
    if (order.title) order.title = order.title.trim();
    order.game = this.game;
    order.service = this.service;

    //? Use calculateResult as here to avoid repeating.
    order.totalPrice = calculateResult.total;
    order.coupon = calculateResult.coupon;
    order.booster = calculateResult.booster;
    order.details.summary = this.orderDetails.summary;
    order.details.extras = this.orderDetails.extras;
    order.photos = [];

    //? Solo - Duo check
    const duoServices = [
      ServiceCode.LeagueOfLegends_DuoBoost,
      ServiceCode.Valorant_DuoBoost,
      ServiceCode.TeamfightTactics_DuoBoost,
      ServiceCode.WildRift_DuoBoost,
    ];

    //* If duo boost option is selected or service name included in duoServices array then its duo order.
    //* -> default: false
    order.details.general.duoOrder = false;
    if (order.details.extras.duoBoost || duoServices.includes(order.service)) {
      order.details.general.duoOrder = true;
    }

    //! Important
    //! Check is booster eligible to claim this order
    if (order.booster) {
      const booster = await UserRepo.findById(order.booster._id);

      if (
        !booster ||
        !booster.boosterDetails ||
        !booster.boosterDetails.services
      )
        throw new BadRequestError(ApiMessage.AccessDenied);

      const boosterFilters = booster.boosterDetails.services.map((service) =>
        service.filter._id.toString(),
      );

      if (!order.filter)
        throw new BadRequestError(ApiMessage.ServiceFilterNotFound);
      if (!boosterFilters.includes(order.filter._id.toString()))
        throw new BadRequestError(ApiMessage.BoosterNotAvailable);
      const ofilter = order.filter._id.toString();
      const findService = booster.boosterDetails.services.filter(
        (f) => f.filter._id.toString() === ofilter,
      );
      const ranksMap = findService[0].ranks.map((rank) => rank._id.toString());

      if (order.details && order.details.general) {
        // Check via target league
        if (order.details.general.target && order.details.general.target.rank) {
          const rid = order.details.general.target.rank._id.toString();
          if (!ranksMap.includes(rid))
            throw new BadRequestError(ApiMessage.BoosterNotAvailable);
        }
      }
    }

    order.embed = {
      title: order.title,
      fields: [],
    };

    const createdOrder = await OrderRepo.create(
      order,
      order.booster ? false : true, // chat message
    );
    return createdOrder;
  }

  public async findRank(
    tier: string,
    division: number,
    lp?: number,
  ): Promise<IRank> {
    let firstLeague: any = LeagueOfLegends_Tier.Unranked;
    let lpLeague: any = LeagueOfLegends_Tier.Master;

    const excTiers = ['master', 'grandmaster', 'challenger', 'radiant'];
    switch (this.game) {
      case GameCode.Valorant:
        firstLeague = Valorant_Tier.Unranked;
        lpLeague = Valorant_Tier.Immortal;
        break;
      case GameCode.TeamfightTactics:
        firstLeague = TeamfightTactics_Tier.Unranked;
        lpLeague = TeamfightTactics_Tier.Master;
        break;
      case GameCode.WildRift:
        firstLeague = WildRift_Tier.Unranked;
        lpLeague = WildRift_Tier.Master;
        break;
    }

    if (tier === firstLeague) {
      const search = await RankRepo.findByCode(this.game, firstLeague);

      if (!search)
        throw new BadRequestError(
          BoostMessage.RankFilterNotFound_ByFirstLeague,
        );
      return search;
    }

    if (tier === lpLeague) {
      if (lp === undefined) lp = 0;

      const search = await RankRepo.findByLp(this.game, lp);

      if (!search)
        throw new BadRequestError(BoostMessage.RankFilterNotFound_ByLpLeague);
      return search;
    }
    let search = null;
    if (excTiers.includes(tier)) {
      search = await RankRepo.findByCode(this.game, tier); // code: tier
    } else {
      if (division === undefined)
        throw new BadRequestError(
          BoostMessage.RankFilterNotFound_MissingDivision,
        );

      search = await RankRepo.findByCode(this.game, tier + division); // code: tier + division
    }

    if (!search) throw new BadRequestError(BoostMessage.RankFilterNotFound);
    return search;
  }
}
