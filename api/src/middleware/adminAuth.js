import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';

function sign(payload) {
  return crypto.createHmac('sha256', ADMIN_SECRET || 'dev').update(payload).digest('hex');
}

export function createAdminToken() {
  const payload = JSON.stringify({ r: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 });
  return Buffer.from(payload).toString('base64') + '.' + sign(payload);
}

export function verifyAdminToken(token) {
  if (!ADMIN_SECRET && !ADMIN_PASSWORD) return false;
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
  const token = req.headers['x-admin-token'] || req.query.token;
  if (verifyAdminToken(token)) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}
