-- Migration: Add is_connected column to sites table
-- Purpose: Track whether a site has received any data from the tracking script

ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS first_event_at TIMESTAMPTZ;

-- Create index for quick filtering of connected sites
CREATE INDEX IF NOT EXISTS idx_sites_is_connected ON sites(is_connected);
