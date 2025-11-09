-- Create a test agency first (if it doesn't exist)
INSERT INTO agencies (id, name, email, status)
VALUES (
  gen_random_uuid(),
  'Hype Insight',
  'info@hypeinsight.com',
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Create test site for hypeinsight.com
INSERT INTO sites (
  id,
  agency_id,
  name,
  domain,
  script_id,
  status
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM agencies WHERE email = 'info@hypeinsight.com' LIMIT 1),
  'Hype Insight Website',
  'hypeinsight.com',
  'hypeinsight-prod',
  'active'
)
ON CONFLICT (domain) DO NOTHING;

-- Show the created site
SELECT 
  s.id,
  s.script_id,
  s.name,
  s.domain,
  a.name as agency_name
FROM sites s
JOIN agencies a ON s.agency_id = a.id
WHERE s.domain = 'hypeinsight.com';
