import express from 'express';

import list from './list';
import send from './send';
import del from './del';

import { highRateLimiter } from '@helpers/rateLimiter';

const router = express.Router();

router.use('/', list);
router.use('/', send);
router.use('/', del);

export default router;
