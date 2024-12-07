import express from 'express';
import schema from './_schema';
import crypto from 'crypto';
import {
  createTokens,
  getAccessToken,
  validateTokenData,
} from '@core/auth/utils';
import { TokenRefreshResponse } from '@core/ApiResponse';
import { AuthFailureError, BadTokenError } from '@core/ApiError';
import UserRepo from '@repository/UserRepo';
import KeystoreRepo from '@repository/KeystoreRepo';
import validator, { ValidationSource } from '@helpers/validator';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { IProtectedRequest } from 'app-request';
import { Types } from 'mongoose';
import JWT from '@core/JWT';

const router = express.Router();

export default router.post(
  '/',
  validator(schema.auth, ValidationSource.HEADER),
  validator(schema.refreshToken),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const tkn = getAccessToken(req.headers.authorization);
    if (!tkn) throw new AuthFailureError(ApiMessage.Unauthorized);
    req.accessToken = tkn;

    const accessTokenPayload = await JWT.decode(req.accessToken);

    if (!accessTokenPayload) throw new BadTokenError();

    validateTokenData(accessTokenPayload);

    const user = await UserRepo.findById(
      new Types.ObjectId(accessTokenPayload.sub),
    );
    if (!user) throw new AuthFailureError(ApiMessage.UserNotFound);
    req.user = user;

    const refreshTokenPayload = await JWT.validate(req.body.refreshToken);

    if (!refreshTokenPayload) throw new BadTokenError();

    validateTokenData(refreshTokenPayload);

    if (accessTokenPayload.sub !== refreshTokenPayload.sub)
      throw new AuthFailureError(ApiMessage.InvalidAccessToken);

    const keystore = await KeystoreRepo.find(
      req.user._id,
      accessTokenPayload.prm,
      refreshTokenPayload.prm,
    );

    if (!keystore) throw new AuthFailureError(ApiMessage.InvalidAccessToken);
    await KeystoreRepo.remove(keystore._id);

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');

    await KeystoreRepo.create(req.user._id, accessTokenKey, refreshTokenKey);
    const tokens = await createTokens(
      req.user,
      accessTokenKey,
      refreshTokenKey,
    );

    new TokenRefreshResponse(
      ApiMessage.TokenIssued,
      tokens.accessToken,
      tokens.refreshToken,
    ).send(res);
  }),
);
