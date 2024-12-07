import express from 'express';

import blog from './blog';

const router = express.Router();

router.use('/', blog);

export default router;
