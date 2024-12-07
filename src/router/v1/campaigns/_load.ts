import express from 'express';

import services from './services';

const router = express.Router();

router.use('/services', services);

export default router;
