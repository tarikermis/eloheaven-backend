const express = require('express');
const router = express.Router();
import { UserModel } from '@database/models/User';

router.post('/', async (req: any, res: any) => {
  const { consent, user } = req.body;
  try {
    await UserModel.findByIdAndUpdate(user, { consent });
    res.status(200).json({ message: 'Consent updated successfully' });
  } catch (error) {
    console.error('Error updating Consent:', error);
    res.status(500).json({ message: 'Failed to update Consent' });
  }
});

export default router;
