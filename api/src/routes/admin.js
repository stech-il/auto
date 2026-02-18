import { Router } from 'express';
import { adminAuth, createAdminToken } from '../middleware/adminAuth.js';
import * as licenses from '../services/licenses.js';

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin123';

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    const token = createAdminToken();
    return res.json({ ok: true, token });
  }
  res.status(401).json({ error: 'Invalid password' });
});

router.get('/licenses', adminAuth, (req, res) => {
  res.json(licenses.listLicenses());
});

router.post('/licenses', adminAuth, (req, res) => {
  const { site_url, customer } = req.body || {};
  const license = licenses.createLicense({ site_url, customer });
  res.json(license);
});

router.post('/licenses/:id/revoke', adminAuth, (req, res) => {
  const updated = licenses.revokeLicense(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

export { router as adminRouter };
