import express from 'express';
import { highRateLimiter } from '@helpers/rateLimiter';
import priceList from './price-list';
import avatar from './avatar';
import order from './order';
import document from './document';
import blog from './blog';
import raffle from './raffle';

const router = express.Router();

router.use('/avatar', avatar);
router.use('/price-list', priceList);
router.use('/order', order);
router.use('/document', document);
router.use('/blog', blog);
router.use('/raffle', raffle);

export default router;
