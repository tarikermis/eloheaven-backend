import schema from './schema';
import express from 'express';
import { Types } from 'mongoose';
import { IProtectedRequest } from 'app-request';
import JWT from '@core/JWT';
import UserRepo from '@repository/UserRepo';
import KeystoreRepo from '@repository/KeystoreRepo';
import { getAccessToken, validateTokenData } from '@core/auth/utils';
import validator, { ValidationSource } from '@helpers/validator';
import asyncHandler from '@helpers/asyncHandler';
import {
  AuthFailureError,
  AccessTokenError,
  TokenExpiredError,
  BadTokenError,
} from '@core/ApiError';
import { ApiMessage } from '@common/ApiMessage';

const router = express.Router();

export default router.use(
  validator(schema.auth, ValidationSource.HEADER),
  asyncHandler(async (req: IProtectedRequest, res, next) => {
    const tkn = getAccessToken(req.headers.authorization);
    if (!tkn) throw new AuthFailureError(ApiMessage.Unauthorized);

    req.accessToken = tkn;

    try {
      const payload = await JWT.validate(req.accessToken, false);
      if (!payload) throw new BadTokenError();

      validateTokenData(payload);

      const user = await UserRepo.findById(new Types.ObjectId(payload.sub));
      if (!user) throw new AuthFailureError(ApiMessage.UserNotFound);
      req.user = user;

      const keystore = await KeystoreRepo.findforKey(req.user._id, payload.prm);
      if (!keystore) throw new AuthFailureError(ApiMessage.InvalidAccessToken);
      req.keystore = keystore;

      return next();
    } catch (e) {
      if (e instanceof TokenExpiredError)
        throw new AccessTokenError(ApiMessage.TokenExpired);
      throw e;
    }
  }),
);
