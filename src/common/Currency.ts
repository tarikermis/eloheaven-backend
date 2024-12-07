import { systemCurrency } from '@config';
import axios from 'axios';

export enum Currency {
  USD = 'usd', //* default: config.ts
  EUR = 'eur',
  GBP = 'gbp',
  CAD = 'cad',
  AUD = 'aud',
}

export interface ICurrencyRatesResponse {
  result: string;
  time_next_update_unix: number;
  base_code: string;
  rates: {
    USD: number;
    EUR: number;
    GBP: number;
    CAD: number;
    AUD: number;
  };
}

export async function getCurrencyRates(
  base_code: string = systemCurrency,
): Promise<ICurrencyRatesResponse | null> {
  const base = 'https://open.er-api.com/v6/latest/';
  const response = await axios.get(base + base_code);
  const res = response.data as ICurrencyRatesResponse;

  if (res.result == 'success') return res;
  else return null;
}
