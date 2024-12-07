import express from 'express';
import { IProtectedRequest } from 'app-request';
import KeystoreRepo from '@repository/KeystoreRepo';
import { SuccessMsgResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';

const router = express.Router();

router.delete(
  '/',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    await KeystoreRepo.remove(req.keystore._id);
    new SuccessMsgResponse(ApiMessage.LogoutSuccess).send(res);
  }),
);

export default router;
