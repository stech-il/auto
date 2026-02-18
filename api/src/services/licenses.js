import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USE_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

let supabase = null;
async function initSupabase() {
  if (!USE_SUPABASE) return;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    console.log('Licenses: using Supabase (persistent)');
  } catch (err) {
    console.warn('Supabase init failed:', err.message, '- using file storage');
  }
}
initSupabase();

// ---- File storage ----
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

function loadFile() {
  ensureDir();
  if (!fs.existsSync(LICENSES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveFile(licenses) {
  ensureDir();
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2), 'utf8');
}

// ---- Supabase ----
async function loadFromSupabase() {
  if (!supabase) return loadFile();
  try {
    const { data, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Supabase load error:', err.message);
    return [];
  }
}

// ---- Unified API (async) ----
export async function listLicenses() {
  if (supabase) {
    return loadFromSupabase();
  }
  return loadFile();
}

export async function createLicense(data) {
  const id = crypto.randomUUID();
  const key = crypto.randomBytes(16).toString('hex').toUpperCase();
  const license = {
    id,
    key,
    site_url: data.site_url || '',
    customer: data.customer || '',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('licenses').insert(license);
      return license;
    } catch (err) {
      console.error('Supabase create error:', err);
      throw err;
    }
  }
  const licenses = loadFile();
  licenses.push(license);
  saveFile(licenses);
  return license;
}

export async function revokeLicense(id) {
  if (supabase) {
    const licenses = await loadFromSupabase();
    const item = licenses.find((l) => l.id === id);
    if (!item) return null;
    const revokedAt = new Date().toISOString();
    try {
      await supabase.from('licenses').update({ status: 'revoked', revoked_at: revokedAt }).eq('id', id);
      return { ...item, status: 'revoked', revoked_at: revokedAt };
    } catch (err) {
      console.error('Supabase revoke error:', err);
      return null;
    }
  }
  const licenses = loadFile();
  const idx = licenses.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  licenses[idx].status = 'revoked';
  licenses[idx].revoked_at = new Date().toISOString();
  saveFile(licenses);
  return licenses[idx];
}

export async function getByKey(key) {
  const normalized = (key || '').trim().toUpperCase();
  if (!normalized) return null;

  if (supabase) {
    const licenses = await loadFromSupabase();
    return licenses.find((l) => l.key === normalized && l.status === 'active') || null;
  }
  const licenses = loadFile();
  return licenses.find((l) => l.key === normalized && l.status === 'active') || null;
}
