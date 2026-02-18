import { Router } from 'express';
import { generateSiteStructure } from '../services/claude.js';
import { validateLicense } from '../services/license.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { license_key, prompt, site_url } = req.body;

    if (!license_key || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing license_key or prompt',
      });
    }

    const licenseValid = validateLicense(license_key);
    if (!licenseValid.valid) {
      return res.status(401).json({ success: false, error: 'Invalid license' });
    }

    const siteData = await generateSiteStructure(prompt);

    res.json({
      success: true,
      data: siteData,
    });
  } catch (err) {
    console.error('Build error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Build failed',
    });
  }
});

export { router as buildRouter };
