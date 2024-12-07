import express from 'express';

import list from './list';
import readAll from './read-all';

const router = express.Router();

router.use('/', list);
router.use('/read-all', readAll);

export default router;
