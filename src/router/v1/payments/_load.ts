import express from 'express';
import { apiLimiter } from '@helpers/rateLimiter';

import addFunds from './add-funds';
import order from './order';
import sendTip from './send-tip';
import redirect from './redirect';

const router = express.Router();

router.use('/add-funds', addFunds);
router.use('/order', order);
router.use('/send-tip', sendTip);
router.use('/redirect', redirect);

export default router;
