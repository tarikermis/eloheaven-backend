import express from 'express';
const router = express.Router();

import auth from './auth/_load';
import analytics from './analytics/_load';
import blogs from './blogs/_load';
import data from './data/_load';
import campaigns from './campaigns/_load';
import chats from './chats/_load';
import coupons from './coupons/_load';
import notifications from './notifications/_load';
import orders from './orders/_load';
import users from './users/_load';
import roles from './roles/_load';
import raffles from './raffles/_load';
import ranks from './ranks/_load';
import payments from './payments/_load';
import services from './services/_load';
import upload from './uploads/_load';
import webhooks from './webhooks/_load';
import sites from './sites/_load';

// middlewares
import ipAddress from '@helpers/ipAddress';
import currency from '@helpers/currency';
import bodyParser from 'body-parser';
import { baseDomain, environment } from '@config';

router.use(ipAddress(), currency());
router.use('/webhooks', webhooks);
router.use(bodyParser.json({ limit: '10mb' }));
router.use('/auth', auth);
router.use('/blogs', blogs);
router.use('/analytics', analytics);
router.use('/data', data);
router.use('/campaigns', campaigns);
router.use('/chats', chats);
router.use('/coupons', coupons);
router.use('/notifications', notifications);
router.use('/orders', orders);
router.use('/users', users);
router.use('/roles', roles);
router.use('/raffles', raffles);
router.use('/ranks', ranks);
router.use('/payments', payments);
router.use('/services', services);
router.use('/uploads', upload);
router.use('/sites', sites);

router.get('/heartbeat', (req, res) =>
  res.json({
    success: true,
    beat: 'heartbeat',
    domain: baseDomain,
    environment: environment,
    appVersion: 301,
  }),
);

export default router;
