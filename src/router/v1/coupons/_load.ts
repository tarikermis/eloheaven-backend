import express from 'express';

import create from './create';
import list from './list';
import update from './update';
import remove from './remove';

const router = express.Router();

router.use('/', create); // POST
router.use('/', list); // GET
router.use('/', update); // PUT
router.use('/', remove); // DELETE

export default router;
