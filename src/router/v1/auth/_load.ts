import express from 'express';

import register from './register';
import guest from './guest';
import login from './login';
import refresh from './refresh';
import logout from './logout';
import discord from './discord';
import reset from './reset';
import discordcallback from './discordcallback';
import googlecallback from './googlecallback';
import facebookcallback from './facebookcallback';

const router = express.Router();
router.use('/register', register);
router.use('/login', login);
router.use('/refresh', refresh);
router.use('/reset-password', reset);
router.use('/logout', logout);
router.use('/guest', guest);
router.use('/discord', discord);
router.use('/discordcallback', discordcallback);
router.use('/googlecallback', googlecallback);
router.use('/facebookcallback', facebookcallback);

export default router;
