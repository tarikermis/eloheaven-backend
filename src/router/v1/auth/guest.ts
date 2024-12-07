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
import { sha256 } from '@helpers/hash';
import { sendMailRich } from '@core/integration/mail/Nodemailer';
import { verifyCaptchaV3 } from '@helpers/captcha';
import { readFileSync } from 'fs';
import path from 'path';

const router = express.Router();

router.post(
  '/',
  validator(schema.guestRegister),
  asyncHandler(async (req: IRoleRequest, res) => {
    const checkEmail = await UserRepo.findByEmail(req.body.email);
    if (checkEmail) throw new BadRequestError(ApiMessage.EmailAlreadyExists);

    const verify = await verifyCaptchaV3(req.body.captchaResponse);
    if (!verify) throw new BadRequestError(ApiMessage.InvalidCaptcha);

    const randomUsername = 'guest_' + sha256(req.body.email).slice(0, 8);
    const randomPassword = crypto.randomBytes(6).toString('hex').toUpperCase();

    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');

    const { user: createdUser, keystore } = await UserRepo.create(
      {
        username: randomUsername,
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

    let template = readFileSync(
      path.join(
        __dirname + '../../../../../src/data/templates/guest-welcome.html',
      ),
      'utf-8',
    );

    template = template.replace('{{guest_password}}', randomPassword);

    sendMailRich(
      req.body.email,
      'Welcome to eloheaven!',
      template,
      [],
      [
        {
          filename: 'facebook.png',
          path: path.join(
            __dirname + '../../../../../src/data/templates/images/facebook.png',
          ),
          cid: 'facebook',
        },
        {
          filename: 'twitter.png',
          path: path.join(
            __dirname + '../../../../../src/data/templates/images/twitter.png',
          ),
          cid: 'twitter',
        },
        {
          filename: 'instagram.png',
          path: path.join(
            __dirname +
              '../../../../../src/data/templates/images/instagram.png',
          ),
          cid: 'instagram',
        },
        {
          filename: 'logo.png',
          path: path.join(
            __dirname + '../../../../../src/data/templates/images/logo.png',
          ),
          cid: 'logo',
        },
      ],
    );

    return new SuccessResponse(ApiMessage.RegisterSuccess, {
      user: _.pick(createdUser, ['_id', 'username', 'email', 'role']),
      tokens: tokens,
    }).send(res);
  }),
);

export default router;
