import express from 'express';
import { apiLimiter } from '@helpers/rateLimiter';

import careers from './careers';
import process from './process';
import filters from './filters';
import coaching from './coaching';
import checkout from './checkout';

const router = express.Router();

router.use('/careers', careers);
router.use('/coaching', coaching);
router.use('/process', process);
router.use('/checkout', checkout);
router.use('/filters', filters);

export default router;
