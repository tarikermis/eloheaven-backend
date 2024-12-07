import express from 'express';
import { apiLimiter } from '@helpers/rateLimiter';

import list from './list';

const router = express.Router();

router.use('/', list);

export default router;
