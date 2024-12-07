import express from 'express';
import schema from './_schema';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import { AuthFailureError, BadRequestError } from '@core/ApiError';
import UserRepo from '@repository/UserRepo';
import validator from '@helpers/validator';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { sendMailRich } from '@core/integration/mail/Nodemailer';
import KeystoreRepo from '@database/repository/KeystoreRepo';
import { verifyCaptchaV3 } from '@helpers/captcha';
import { readFileSync } from 'fs';
import path from 'path';
import { baseDomain } from '@config';

const router = express.Router();

router.post(
  '/',
  validator(schema.resetPassword),
  asyncHandler(async (req: IRoleRequest, res) => {
    const verify = await verifyCaptchaV3(req.body.captchaResponse);
    if (!verify) throw new BadRequestError(ApiMessage.InvalidCaptcha);

    const user = await UserRepo.findByEmail(req.body.email);
    if (user) {
      const now = new Date();
      const expire = Date.now() + 3600000; // 1 hours

      if (user.pwdResetTokenExpire && now < user.pwdResetTokenExpire) {
        throw new BadRequestError(ApiMessage.ResetPasswordMailSentAlready);
      }

      const resetToken = crypto.randomBytes(16).toString('hex');
      user.pwdResetToken = resetToken;
      user.pwdResetTokenExpire = new Date(Date.now() + 3600000); // 1 hours

      await UserRepo.updateInfo(user);

      let template = readFileSync(
        path.join(
          __dirname + '../../../../../src/data/templates/reset-password.html',
        ),
        'utf-8',
      );

      template = template.replace(
        '{{reset_password_link}}',
        `${baseDomain}/reset-password/${resetToken}`,
      );

      sendMailRich(
        user.email,
        'Reset your password!',
        template,
        [],
        [
          {
            filename: 'facebook.png',
            path: path.join(
              __dirname +
                '../../../../../src/data/templates/images/facebook.png',
            ),
            cid: 'facebook',
          },
          {
            filename: 'twitter.png',
            path: path.join(
              __dirname +
                '../../../../../src/data/templates/images/twitter.png',
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
    }

    return new SuccessResponse(ApiMessage.ResetPasswordMailSent).send(res);
  }),
);

router.post(
  '/update',
  validator(schema.resetPasswordApply),
  asyncHandler(async (req: IRoleRequest, res) => {
    const user = await UserRepo.findByResetPwdToken(req.body.token);
    if (!user) throw new AuthFailureError(ApiMessage.UserNotFound);
    const now = new Date();
    if (user.pwdResetTokenExpire && now > user.pwdResetTokenExpire) {
      throw new BadRequestError(ApiMessage.TokenExpired);
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    user.password = passwordHash;
    user.pwdResetTokenExpire = new Date(0);

    await UserRepo.updateInfo(user);

    await KeystoreRepo.removeAll(user);

    return new SuccessResponse(ApiMessage.PasswordUpdated).send(res);
  }),
);

export default router;
