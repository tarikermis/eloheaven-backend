import express from 'express';
import { IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import { baseDomain, discordAppId } from '@config';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req: IRoleRequest, res) => {
    // https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
    const scopes = encodeURIComponent(
      ['identify', 'email', 'guilds', 'guilds.join'].join(' '),
    );
    const url = `https://discord.com/api/oauth2/authorize?client_id=${discordAppId}&redirect_uri=${encodeURIComponent(
      baseDomain,
    )}&response_type=code&scope=${scopes}`;
    new SuccessResponse(ApiMessage.Success, {
      url,
    }).send(res);
  }),
);

export default router;
