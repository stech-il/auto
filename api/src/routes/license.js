import { Router } from 'express';
import { validateLicense } from '../services/license.js';

const router = Router();

router.post('/validate', async (req, res) => {
  const { license_key, site_url } = req.body;

  if (!license_key) {
    return res.status(400).json({ valid: false, error: 'Missing license_key' });
  }

  const result = await validateLicense(license_key);

  if (!result.valid) {
    return res.status(401).json({ valid: false, error: 'Invalid license' });
  }

  res.json({ valid: true });
});

export { router as licenseRouter };
