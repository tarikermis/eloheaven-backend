import express from 'express';

import geolocation from './geolocation';
import currencyRates from './currency-rates';
import champions from './champions';
import agents from './agents';
import trustpilot from './trustpilot';

const router = express.Router();

router.use('/geolocation', geolocation);
router.use('/currency-rates', currencyRates);
router.use('/champions', champions);
router.use('/agents', agents);
router.use('/trust-pilot', trustpilot);

export default router;
