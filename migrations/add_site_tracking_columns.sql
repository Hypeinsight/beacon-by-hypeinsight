-- Migration: Add site tracking columns
-- Date: 2025-11-12
-- Description: Add is_connected and first_event_at columns to sites table

ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE;

ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS first_event_at TIMESTAMP;

-- Soft delete support
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Update existing sites that have events to mark as connected
UPDATE sites s
SET is_connected = TRUE,
    first_event_at = (SELECT MIN(server_timestamp) FROM events WHERE site_id = s.id)
WHERE EXISTS (SELECT 1 FROM events WHERE site_id = s.id)
  AND (is_connected IS FALSE OR is_connected IS NULL);
