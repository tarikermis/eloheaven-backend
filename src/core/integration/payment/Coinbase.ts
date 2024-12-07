import coinbase from 'coinbase-commerce-node';
import { baseDomain, coinbaseApiKey, environment } from '@config';
import { safeFloat } from '@helpers/number';
import { sha256 } from '@helpers/hash';

const Client = coinbase.Client;
const Charge = coinbase.resources.Charge;

Client.init(coinbaseApiKey);

export const createCharge = async (payload: {
  charge: {
    name: string;
    description: string;
    metadata: {
      userBalance?: number;
      paymentId: string;
    };
    amount: string;
    currency: any;
  };
  cancel_url?: string;
  success_url?: string;
}) => {
  const payAmount = safeFloat(payload.charge.amount).toString();
  const chargeData = new Charge({
    name: payload.charge.name,
    description: payload.charge.description,
    metadata: payload.charge.metadata,
    pricing_type: 'fixed_price',
    local_price: {
      amount: payAmount,
      currency: payload.charge.currency,
    },
  });

  const pid = payload.charge.metadata.paymentId;
  const successSecret = sha256(`eloheaven|${pid}|success`);
  const cancelSecret = sha256(`eloheaven|${pid}|cancel`);

  let urlPrefix = '/v1';
  if (environment !== 'development') urlPrefix = '/api/v1';

  let success_url = `${baseDomain}${urlPrefix}/payments/redirect/success/${pid}/${successSecret}`;
  let cancel_url = `${baseDomain}${urlPrefix}/payments/redirect/cancel/${pid}/${cancelSecret}`;

  if (payload.success_url) success_url = payload.success_url;
  if (payload.cancel_url) cancel_url = payload.cancel_url;

  chargeData.redirect_url = success_url;
  chargeData.cancel_url = cancel_url;

  const charge = await chargeData.save();

  return charge;
};

export default coinbase;
