import { Router } from 'express';
import { adminAuth, createAdminToken } from '../middleware/adminAuth.js';
import * as licenses from '../services/licenses.js';

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin123';

router.post('/login', (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    if (password === ADMIN_PASSWORD) {
      const token = createAdminToken();
      return res.json({ ok: true, token });
    }
    res.status(401).json({ error: 'Invalid password' });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/licenses', adminAuth, (req, res) => {
  try {
    res.json(licenses.listLicenses());
  } catch (err) {
    console.error('listLicenses error:', err);
    res.status(500).json({ error: 'Failed to load licenses', details: err.message });
  }
});

router.post('/licenses', adminAuth, (req, res) => {
  try {
    const { site_url, customer } = req.body || {};
    const license = licenses.createLicense({ site_url, customer });
    res.json(license);
  } catch (err) {
    console.error('createLicense error:', err);
    res.status(500).json({ error: 'Failed to create license', details: err.message });
  }
});

router.post('/licenses/:id/revoke', adminAuth, (req, res) => {
  try {
    const updated = licenses.revokeLicense(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('revokeLicense error:', err);
    res.status(500).json({ error: 'Failed to revoke', details: err.message });
  }
});

export { router as adminRouter };
