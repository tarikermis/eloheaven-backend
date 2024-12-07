import express from 'express';

import online from './online';
import stats from './stats';

const router = express.Router();

router.use('/online', online);
router.use('/stats', stats);

export default router;
