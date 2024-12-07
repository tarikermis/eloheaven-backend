import _ from 'lodash';
import express from 'express';
import schema from './_schema';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { IRoleRequest } from 'app-request';
import { createTokens } from '@core/auth/utils';
import { SuccessResponse } from '@core/ApiResponse';
import { BadRequestError } from '@core/ApiError';
import UserRepo from '@repository/UserRepo';
import { RoleCode } from '@models/Role';
import User from '@models/User';
import validator from '@helpers/validator';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';

const router = express.Router();

router.post(
  '/',
  validator(schema.register),
  asyncHandler(async (req: IRoleRequest, res) => {
    // const verify = await verifyCaptchaV3(req.body.captchaResponse);
    // if (!verify) throw new BadRequestError(ApiMessage.InvalidCaptcha);

    const checkEmail = await UserRepo.findByEmail(req.body.email);
    if (checkEmail) throw new BadRequestError(ApiMessage.EmailAlreadyExists);

    const checkUsername = await UserRepo.findByUsername(req.body.username);
    if (checkUsername)
      throw new BadRequestError(ApiMessage.UsernameAlreadyExists);

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const { user: createdUser, keystore } = await UserRepo.create(
      {
        username: req.body.username,
        email: req.body.email,
        password: passwordHash,
        firstLoginIp: req.ipAddress,
        lastLoginIp: req.ipAddress,
      } as User,
      accessTokenKey,
      refreshTokenKey,
      RoleCode.User,
    );

    const tokens = await createTokens(
      createdUser,
      keystore.primaryKey,
      keystore.secondaryKey,
    );
    new SuccessResponse(ApiMessage.RegisterSuccess, {
      user: _.pick(createdUser, [
        '_id',
        'username',
        'email',
        'role',
        'balance',
      ]),
      tokens: tokens,
    }).send(res);
  }),
);

export default router;
