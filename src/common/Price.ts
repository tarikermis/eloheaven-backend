import ICoupon from '@database/models/Coupon';
import IUser from '@database/models/User';

export const enum PriceType {
  Main = 'main',
  Extra = 'extra',
  Discount = 'discount',
}

export const enum IncreaseType {
  Percentage = 'percentage',
  Direct = 'direct',
}

export class PriceLayer {
  constructor(
    public label: string,
    public priceType: PriceType,
    public increaseType: IncreaseType = IncreaseType.Direct,
    public amount: number = 0,
  ) {}
}

export interface ICalculateResult {
  layers: PriceLayer[];
  coupon?: ICoupon;
  booster?: IUser;
  total: number;
  totalWithoutDiscount: number;
  // for discord webhook message
  fields?: { name: string; value: string; inline?: boolean | false }[];
}
