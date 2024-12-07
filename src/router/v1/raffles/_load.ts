import express from 'express';

import create from './create';
import list from './list';
import update from './update';
import remove from './remove';
import details from './details';

const router = express.Router();

router.use('/', create);
router.use('/list', list);
router.use('/', update);
router.use('/', remove);
router.use('/details', details);

export default router;
