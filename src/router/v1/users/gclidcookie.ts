const express = require('express');
const router = express.Router();
import { UserModel } from '@database/models/User';

router.post('/', async (req: any, res: any) => {
  const { gclid, user } = req.body;
  if (!gclid || !user)
    return res.status(400).json({ message: 'GCLID and user are required' });
  try {
    await UserModel.findByIdAndUpdate(user, { gclid });
    res.status(200).json({ message: 'GCLID updated successfully' });
  } catch (error) {
    console.error('Error updating GCLID:', error);
    res.status(500).json({ message: 'Failed to update GCLID' });
  }
});

export default router;
