import { ServerCode } from '@core/boost/Boost';
import { LeagueOfLegends_QueueType } from '@core/boost/games/LeagueOfLegends';
import { Types } from 'mongoose';
import { PriceLayer } from './Price';

export interface IOrderDetails {
  general: {
    current?: {
      tier?: string;
      division?: number;
      lp?: number;
      rr?: number;
      mark?: number;

      // to check is booster eligible to claim order or not.
      rank?: Types.ObjectId;
    };
    target?: {
      tier?: string;
      division?: number;
      lp?: number;
      rr?: number;
      mark?: number;

      // to check is booster eligible to claim order or not.
      rank?: Types.ObjectId;
    };
    server?: ServerCode;
    queueType?: LeagueOfLegends_QueueType;
    duoOrder?: boolean;
    sessionTime?: number;
    lpGain?: number;
  };
  extras: IExtraOptions;
  summary: PriceLayer[];
}

export interface IExtraOptions {
  appearOffline?: boolean;
  streamGames?: boolean;
  priorityOrder?: boolean;
  extraWin?: boolean;
  customFlash?: string;
  customLanes?: {
    primary: string;
    secondary: string;
  };
  customChampions?: string[] | [];
  duoBoost?: boolean;
  soloOnly?: boolean;
  vpnOn?: boolean;
  noStack?: boolean;
  premiumDuoBoost?: boolean;
  lowLpGain?: boolean;
  ghostBoost?: boolean;
  normalizeScore?: boolean;
}

export const enum ExtraOption {
  AppearOffline = 'appearOffline',
  StreamGames = 'streamGames',
  PriorityOrder = 'priorityOrder',
  DuoBoost = 'duoBoost',
  ExtraWin = 'extraWin',
  CustomFlash = 'customFlash',
  CustomLanes = 'customLanes',
  CustomChampions = 'customChampions',
  SoloOnly = 'soloOnly',
  VpnOn = 'vpnOn',
  NoStack = 'noStack',
  PremiumDuoBoost = 'premiumDuoBoost',
  LowLpGain = 'lowLpGain',
  GhostBoost = 'ghostBoost',
  NormalizeScore = 'normalizeScore',
}
