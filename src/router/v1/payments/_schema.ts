import { PaymentMethod } from '@database/models/Payment';
import { JoiObjectId } from '@helpers/validator';
import Joi from 'joi';
export default {
  addFunds: Joi.object().keys({
    amount: Joi.number().precision(2).min(5).max(100000).required(),
    method: Joi.string()
      .valid(PaymentMethod.Stripe, PaymentMethod.Coinbase, PaymentMethod.Paypal)
      .required(),
  }),
  payOrder: Joi.object().keys({
    order: JoiObjectId().required(),
    useBalance: Joi.boolean().strict().required(),
    method: Joi.string()
      .valid(PaymentMethod.Stripe, PaymentMethod.Coinbase, PaymentMethod.Paypal)
      .required(),
  }),
  sendTip: Joi.object().keys({
    order: JoiObjectId().required(),
    amount: Joi.number().precision(2).min(5).max(100000).required(),
    useBalance: Joi.boolean().strict().required(),
    method: Joi.string()
      .valid(PaymentMethod.Stripe, PaymentMethod.Coinbase, PaymentMethod.Paypal)
      .required(),
  }),
  redirect: Joi.object().keys({
    result: Joi.string().valid('success', 'cancel').required(),
    payment_id: JoiObjectId().required(),
    payment_secret: Joi.string().required(),
  }),
};
