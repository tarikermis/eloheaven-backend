import Stripe from 'stripe';
import { baseDomain, environment, stripeSecretKey } from '@config';
import { safeFloat, safeInt } from '@helpers/number';
import { sha256 } from '@helpers/hash';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const createCustomer = async (payload: {
  name: string;
  email: string;
  phone?: string;
}) => {
  const customer = await stripe.customers.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
  });
};

export const createCheckoutSession = async (payload: {
  product: {
    name: string;
    images: string[];
    description?: string;
    metadata: {
      userBalance?: number;
      paymentId: string;
    };
  };
  email: string;
  amount: number;
  currency: any;
  cancel_url?: string;
  success_url?: string;
  return_url?: string;
}) => {
  const product = await stripe.products.create(payload.product);
  const checkoutAmount = safeFloat(payload.amount); // to make sure its working with integers

  const pid = payload.product.metadata.paymentId;
  const successSecret = sha256(`eloheaven|${pid}|success`);
  const cancelSecret = sha256(`eloheaven|${pid}|cancel`);
  let urlPrefix = '/v1';
  if (environment !== 'development') urlPrefix = '/api/v1';

  let success_url = `${baseDomain}${urlPrefix}/payments/redirect/success/${pid}/${successSecret}`;
  let cancel_url = `${baseDomain}${urlPrefix}/payments/redirect/cancel/${pid}/${cancelSecret}`;

  if (payload.success_url) success_url = payload.success_url;
  if (payload.cancel_url) cancel_url = payload.cancel_url;

  const price = await stripe.prices.create({
    unit_amount: safeInt(checkoutAmount),
    currency: payload.currency,
    product: product.id,
  });

  const session = await stripe.checkout.sessions.create({
    success_url: success_url,
    cancel_url: cancel_url,
    payment_method_options: {
      card: {
        request_three_d_secure: 'challenge',
      },
    },
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode: 'payment',
    allow_promotion_codes: true,
  });
  return session;
};

export default stripe;
