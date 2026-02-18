import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('ensureDir failed:', err.message);
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(LICENSES_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(licenses) {
  ensureDir();
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2), 'utf8');
}

export function listLicenses() {
  return load();
}

export function createLicense(data) {
  const licenses = load();
  const key = crypto.randomBytes(16).toString('hex').toUpperCase();
  const license = {
    id: crypto.randomUUID(),
    key,
    site_url: data.site_url || '',
    customer: data.customer || '',
    status: 'active',
    created_at: new Date().toISOString(),
  };
  licenses.push(license);
  save(licenses);
  return license;
}

export function revokeLicense(id) {
  const licenses = load();
  const idx = licenses.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  licenses[idx].status = 'revoked';
  licenses[idx].revoked_at = new Date().toISOString();
  save(licenses);
  return licenses[idx];
}

export function getByKey(key) {
  const licenses = load();
  const normalized = (key || '').trim().toUpperCase();
  return licenses.find(
    (l) => l.key === normalized && l.status === 'active'
  );
}
