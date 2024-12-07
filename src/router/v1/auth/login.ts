import _ from 'lodash';
import express from 'express';
import schema from './_schema';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { createTokens } from '@core/auth/utils';
import { SuccessResponse } from '@core/ApiResponse';
import { BadRequestError, AuthFailureError } from '@core/ApiError';
import UserRepo from '@repository/UserRepo';
import KeystoreRepo from '@repository/KeystoreRepo';
import validator from '@helpers/validator';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { IPublicRequest } from 'app-request';
import IAuditLog, { LogScope } from '@database/models/AuditLog';
import AuditLogRepo from '@database/repository/AuditLogRepo';

const router = express.Router();

export default router.post(
  '/',
  validator(schema.login),
  asyncHandler(async (req: IPublicRequest, res) => {
    const userByName = await UserRepo.findByUsername(req.body.username);
    const userByEmail = await UserRepo.findByEmail(req.body.username);
    let user;

    // const verify = await verifyCaptchaV3(req.body.captchaResponse);
    // if (!verify) throw new BadRequestError(ApiMessage.InvalidCaptcha);

    if (!userByName && !userByEmail)
      throw new BadRequestError(ApiMessage.InvalidCredentials);

    if (!!userByName) user = userByName;
    if (!!userByEmail) user = userByEmail;

    if (!user) throw new BadRequestError(ApiMessage.InvalidCredentials);
    if (!user.password) throw new BadRequestError('Credential not set');

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) throw new AuthFailureError(ApiMessage.InvalidCredentials);
    if (!user.status) throw new AuthFailureError(ApiMessage.AccountBanned);

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');

    await KeystoreRepo.create(user._id, accessTokenKey, refreshTokenKey);
    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);

    // Update last login details
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ipAddress;

    await UserRepo.updateInfo(user);

    const log = {
      user: user,
      message: `Login successful. IP: ${req.ipAddress}`,
      scope: LogScope.Auth,
    } as IAuditLog;

    await AuditLogRepo.create(log);

    new SuccessResponse(ApiMessage.LoginSuccess, {
      user: _.pick(user, ['_id', 'username', 'email', 'role', 'balance']),
      tokens: tokens,
    }).send(res);
  }),
);
