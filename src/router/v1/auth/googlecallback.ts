import _ from 'lodash';
import express from 'express';
import crypto from 'crypto';
import { createTokens } from '@core/auth/utils';
import { SuccessResponse } from '@core/ApiResponse';
import UserRepo from '@repository/UserRepo';
import { RoleCode } from '@models/Role';
import User from '@models/User';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { googleOauthAppId, googleOauthToken } from '@config';
import axios from 'axios';
import KeystoreRepo from '@repository/KeystoreRepo';
import IAuditLog, { LogScope } from '@database/models/AuditLog';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import { IRoleRequest } from 'app-request';

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req: IRoleRequest, res) => {
    try {
      const code = req.body.code;

      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: googleOauthAppId,
          client_secret: googleOauthToken,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://eloheaven.gg/',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const accessTokenKey = crypto.randomBytes(64).toString('hex');
      const refreshTokenKey = crypto.randomBytes(64).toString('hex');

      const userProfileResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        },
      );

      const googleUserProfile = userProfileResponse.data;

      const user = await UserRepo.findByEmail(googleUserProfile.email);

      if (!user) {
        const generatedUsername = googleUserProfile.email.split('@')[0];

        const { user: createdUser, keystore } = await UserRepo.create(
          {
            username: generatedUsername,
            email: googleUserProfile.email,
            password: String(Math.floor(Math.random() * 999999)),
            firstLoginIp: req.ipAddress,
            lastLoginIp: req.ipAddress,
            discordId: googleUserProfile.id,
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

        return new SuccessResponse(ApiMessage.RegisterSuccess, {
          user: _.pick(createdUser, [
            '_id',
            'username',
            'email',
            'role',
            'balance',
          ]),
          tokens: tokens,
        }).send(res);
      }

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
    } catch (err) {
      console.log(err);
    }
  }),
);

export default router;
