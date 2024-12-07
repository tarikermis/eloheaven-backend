import express from 'express';
import { IPublicRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { io } from '../../../server';
const router = express.Router();

router.get(
  '/kick-sockets',
  asyncHandler(async (req: IPublicRequest, res) => {
    io.server.disconnectSockets();

    res.json({ received: true });
  }),
);

export default router;
