import express from 'express';

import list from './list';
import details from './details';
import booster from './booster';
import user from './user';
import update from './update';

const router = express.Router();

router.use('/booster', booster);
router.use('/user', user);
router.use('/list', list);
router.use('/details', details);
router.use('/update', update);

export default router;
