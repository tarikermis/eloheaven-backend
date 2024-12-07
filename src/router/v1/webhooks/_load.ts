import express from 'express';
import stripe from './stripe';
import coinbase from './coinbase';
import docker from './docker';
import paypal from './paypal';
const router = express.Router();

router.use('/coinbase', coinbase);
router.use('/stripe', stripe);
router.use('/docker', docker);
router.use('/paypal', paypal);

export default router;
