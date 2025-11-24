-- Add password reset columns to dashboard_users table
ALTER TABLE dashboard_users
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_users_reset_token 
ON dashboard_users(reset_token) 
WHERE reset_token IS NOT NULL;
