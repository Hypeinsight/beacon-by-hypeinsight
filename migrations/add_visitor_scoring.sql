-- Migration: Add Visitor Scoring System
-- Creates tables and indexes for tracking visitor scores based on event activities

-- Create event_scoring_rules table
CREATE TABLE IF NOT EXISTS event_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  score_value INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique event rules per site
  UNIQUE(site_id, event_name)
);

-- Create visitor_scores table
CREATE TABLE IF NOT EXISTS visitor_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  client_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  total_score INTEGER DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique visitor per site
  UNIQUE(site_id, client_id)
);

-- Create score_history table for tracking score changes over time
CREATE TABLE IF NOT EXISTS score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_score_id UUID NOT NULL REFERENCES visitor_scores(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  score_change INTEGER NOT NULL,
  total_score_after INTEGER NOT NULL,
  event_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for event_scoring_rules
CREATE INDEX IF NOT EXISTS idx_scoring_rules_site_id ON event_scoring_rules(site_id);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_event_name ON event_scoring_rules(event_name);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_active ON event_scoring_rules(active);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_site_active ON event_scoring_rules(site_id, active);

-- Create indexes for visitor_scores
CREATE INDEX IF NOT EXISTS idx_visitor_scores_site_id ON visitor_scores(site_id);
CREATE INDEX IF NOT EXISTS idx_visitor_scores_client_id ON visitor_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_visitor_scores_total_score ON visitor_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_scores_site_score ON visitor_scores(site_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_scores_last_updated ON visitor_scores(last_updated DESC);

-- Create indexes for score_history
CREATE INDEX IF NOT EXISTS idx_score_history_visitor_score_id ON score_history(visitor_score_id);
CREATE INDEX IF NOT EXISTS idx_score_history_created_at ON score_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_event_name ON score_history(event_name);

-- Create GIN index for score_breakdown JSONB
CREATE INDEX IF NOT EXISTS idx_visitor_scores_breakdown ON visitor_scores USING GIN(score_breakdown);

-- Create trigger for updated_at on event_scoring_rules
CREATE TRIGGER update_scoring_rules_updated_at BEFORE UPDATE ON event_scoring_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for top scored visitors
CREATE OR REPLACE VIEW top_scored_visitors AS
SELECT 
  vs.site_id,
  vs.client_id,
  vs.total_score,
  vs.score_breakdown,
  vs.last_updated,
  e.visitor_type,
  e.ip_company_name,
  e.ip_company_domain,
  e.ip_city,
  e.ip_country,
  COUNT(DISTINCT e.session_id) as session_count,
  COUNT(e.id) as total_events
FROM visitor_scores vs
LEFT JOIN events e ON vs.site_id = e.site_id AND vs.client_id = e.client_id
GROUP BY vs.site_id, vs.client_id, vs.total_score, vs.score_breakdown, vs.last_updated,
         e.visitor_type, e.ip_company_name, e.ip_company_domain, e.ip_city, e.ip_country
ORDER BY vs.total_score DESC;

-- Comments
COMMENT ON TABLE event_scoring_rules IS 'Defines score values for different event types per site';
COMMENT ON TABLE visitor_scores IS 'Tracks cumulative scores for each visitor (client_id) on each site';
COMMENT ON TABLE score_history IS 'Audit trail of score changes for each visitor';
COMMENT ON COLUMN event_scoring_rules.score_value IS 'Points awarded when this event occurs (can be negative)';
COMMENT ON COLUMN visitor_scores.score_breakdown IS 'JSON object mapping event_name to count: {"page_view": 5, "form_submit": 2}';
