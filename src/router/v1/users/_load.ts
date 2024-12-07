import express from 'express';

import me from './me';
import profile from './profile';
import details from './details';
import update from './update';
import list from './list';
import gclidcookie from './gclidcookie';
import consent from './consent';

const router = express.Router();

router.use('/@me', me);
router.use('/profile', profile);
router.use('/update', update);
router.use('/list', list);
router.use('/details', details);
router.use('/gclidcookie', gclidcookie);
router.use('/consent', consent);

export default router;
