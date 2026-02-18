-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Creates the licenses table for persistent storage

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  site_url TEXT DEFAULT '',
  customer TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Allow service role to do everything (backend uses service key)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role full access" ON licenses
  FOR ALL
  USING (true)
  WITH CHECK (true);
