import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'admin123';

function sign(payload) {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
}

export function createAdminToken() {
  const payload = JSON.stringify({ r: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 });
  return Buffer.from(payload).toString('base64') + '.' + sign(payload);
}

export function verifyAdminToken(token) {
  if (!ADMIN_SECRET) return false;
  if (!token) return false;
  const [payloadB64, sig] = String(token).split('.');
  if (!payloadB64 || !sig) return false;
  try {
    const payload = Buffer.from(payloadB64, 'base64').toString('utf8');
    if (sign(payload) !== sig) return false;
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return false;
    return data.r === 'admin';
  } catch {
    return false;
  }
}

export function adminAuth(req, res, next) {
  try {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (verifyAdminToken(token)) {
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  } catch (err) {
    console.error('adminAuth error:', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}
