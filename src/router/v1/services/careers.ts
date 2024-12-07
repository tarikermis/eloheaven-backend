import express from 'express';
import schema from './_schema';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import path from 'path';
import { sendMailRich } from '@core/integration/mail/Nodemailer';
import { readFileSync } from 'fs';
import validator from '@helpers/validator';
import { BadRequestError } from '@core/ApiError';
import { verifyCaptchaV2 } from '@helpers/captcha';

const router = express.Router();

router.post(
  '/',
  validator(schema.careers),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const verify = await verifyCaptchaV2(req.body.captchaResponse);
    if (!verify) throw new BadRequestError(ApiMessage.InvalidCaptcha);

    let template = readFileSync(
      path.join(
        __dirname + '../../../../../src/data/templates/become-booster.html',
      ),
      'utf-8',
    );

    template = template.replaceAll('{{name}}', req.body.name);
    template = template.replaceAll('{{email}}', req.body.email);
    template = template.replaceAll('{{discord}}', req.body.discord);
    template = template.replaceAll('{{game}}', req.body.game);
    template = template.replaceAll('{{message}}', req.body.message);
    template = template.replaceAll('{{servers}}', req.body.servers.join(', '));
    sendMailRich(
      'recruiting@eloheaven.gg',
      'New booster application!',
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

    return new SuccessResponse(ApiMessage.Success).send(res);
  }),
);

export default router;
