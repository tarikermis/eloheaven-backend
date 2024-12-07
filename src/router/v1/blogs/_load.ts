import express from 'express';

import create from './create';
import update from './update';
import remove from './remove';
import list from './list';

const router = express.Router();

router.use('/', create);
router.use('/', update);
router.use('/', remove);
router.use('/', list);

export default router;
