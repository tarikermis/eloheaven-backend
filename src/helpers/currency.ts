import { Currency } from '@common/Currency';
import { redisKeys, systemCurrency } from '@config';
import redisClient from '../redis';
import { IPublicRequest } from 'app-request';
import { Response, NextFunction } from 'express';

export default () =>
  (req: IPublicRequest, res: Response, next: NextFunction) => {
    let currency = Currency.USD;

    if (Object.values(Currency).includes(req.cookies?.currency))
      currency = req.cookies.currency as Currency;

    req.currency = currency;
    next();
  };

export const convertCurrency = async (
  amount: number,
  from: Currency,
  to: Currency = systemCurrency as Currency,
) => {
  const cacheData = await redisClient.get(redisKeys.currencyRates);
  const cacheJson = cacheData ? JSON.parse(cacheData) : null;

  let rates = cacheJson;

  if (!rates) {
    if (process.env.NODE_ENV === 'development') {
      rates = {
        [from]: 1,
        [to]: 1,
      };
    } else {
      return 0;
    }
  }

  const f = rates[from];
  const t = rates[to];

  return (amount / f) * t;
};
