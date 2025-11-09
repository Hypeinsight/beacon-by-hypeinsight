-- Beacon Database Schema
-- PostgreSQL database schema for event tracking
-- Based on Warp Server-Side Tracking Solution Specification v1.0

-- Create agencies table for multi-tenancy
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  api_key VARCHAR(255),
  config JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sites table for client websites
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  script_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table with complete data points from specification
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Event Metadata
  event_name VARCHAR(255) NOT NULL,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  event_timestamp BIGINT NOT NULL,
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  script_version VARCHAR(50),
  
  -- User Identification
  client_id VARCHAR(255),
  user_id VARCHAR(255),
  session_id VARCHAR(255) NOT NULL,
  email_hash VARCHAR(64),
  phone_hash VARCHAR(64),
  first_name_hash VARCHAR(64),
  last_name_hash VARCHAR(64),
  
  -- Device & Browser Data
  user_agent TEXT,
  device_category VARCHAR(50),
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  operating_system VARCHAR(100),
  screen_resolution VARCHAR(50),
  viewport_size VARCHAR(50),
  device_pixel_ratio DECIMAL(4,2),
  language VARCHAR(10),
  timezone VARCHAR(100),
  
  -- Network & Location Data (captured)
  ip_address INET,
  
  -- Network & Location Data (from IPinfo enrichment)
  ip_city VARCHAR(255),
  ip_region VARCHAR(255),
  ip_country VARCHAR(10),
  ip_postal_code VARCHAR(20),
  ip_latitude DECIMAL(10,7),
  ip_longitude DECIMAL(10,7),
  ip_timezone VARCHAR(100),
  ip_organization TEXT,
  ip_asn VARCHAR(50),
  ip_asn_name TEXT,
  ip_asn_domain VARCHAR(255),
  ip_company_name TEXT,
  ip_company_domain VARCHAR(255),
  ip_connection_type VARCHAR(50),
  ip_is_vpn BOOLEAN DEFAULT FALSE,
  ip_is_proxy BOOLEAN DEFAULT FALSE,
  ip_is_tor BOOLEAN DEFAULT FALSE,
  ip_is_hosting BOOLEAN DEFAULT FALSE,
  visitor_type VARCHAR(50),
  
  -- Page & Referral Data
  page_url TEXT,
  page_path TEXT,
  page_title TEXT,
  page_hostname VARCHAR(255),
  page_referrer TEXT,
  referrer_hostname VARCHAR(255),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  gclid VARCHAR(255),
  fbclid VARCHAR(255),
  ttclid VARCHAR(255),
  
  -- Engagement & Behavior Data
  engagement_time_msec INTEGER,
  scroll_depth_percent INTEGER,
  scroll_depth_pixels INTEGER,
  time_on_page_sec INTEGER,
  is_first_visit BOOLEAN DEFAULT FALSE,
  session_number INTEGER,
  page_view_number INTEGER,
  is_bounce BOOLEAN,
  
  -- E-commerce & Lead Generation (stored as JSONB for flexibility)
  ecommerce_data JSONB,
  lead_data JSONB,
  
  -- Additional properties
  properties JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_event_timestamp ON events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_server_timestamp ON events(server_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_visitor_type ON events(visitor_type);
CREATE INDEX IF NOT EXISTS idx_events_ip_company_domain ON events(ip_company_domain);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_site_timestamp ON events(site_id, server_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_site_event_name ON events(site_id, event_name);
CREATE INDEX IF NOT EXISTS idx_events_session_timestamp ON events(session_id, event_timestamp);

-- Create GIN indexes for JSONB properties for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_properties ON events USING GIN(properties);
CREATE INDEX IF NOT EXISTS idx_events_ecommerce_data ON events USING GIN(ecommerce_data);
CREATE INDEX IF NOT EXISTS idx_events_lead_data ON events USING GIN(lead_data);

-- Indexes for sites table
CREATE INDEX IF NOT EXISTS idx_sites_agency_id ON sites(agency_id);
CREATE INDEX IF NOT EXISTS idx_sites_script_id ON sites(script_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);

-- Create users table (dashboard users - admins, managers, clients)
CREATE TABLE IF NOT EXISTS dashboard_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer', -- super_admin, agency_admin, agency_manager, client_user
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table for B2B tracking
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  industry VARCHAR(100),
  location VARCHAR(255),
  city VARCHAR(255),
  region VARCHAR(255),
  country VARCHAR(10),
  employee_count VARCHAR(50),
  revenue_range VARCHAR(50),
  description TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_visits INTEGER DEFAULT 0,
  total_pageviews INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  lead_status VARCHAR(50) DEFAULT 'cold', -- hot, warm, cold
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table for session tracking
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  client_id VARCHAR(255),
  user_id VARCHAR(255),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  visitor_type VARCHAR(50),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  page_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  duration_sec INTEGER,
  is_bounce BOOLEAN DEFAULT FALSE,
  entry_page TEXT,
  exit_page TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  device_category VARCHAR(50),
  browser VARCHAR(100),
  country VARCHAR(10),
  city VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_site_id ON sessions(site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_company_id ON sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);

-- Create indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_lead_status ON companies(lead_status);
CREATE INDEX IF NOT EXISTS idx_companies_last_seen ON companies(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_companies_engagement_score ON companies(engagement_score DESC);

-- Create indexes for dashboard users
CREATE INDEX IF NOT EXISTS idx_dashboard_users_agency_id ON dashboard_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_users_email ON dashboard_users(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_users_updated_at BEFORE UPDATE ON dashboard_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for event analytics
CREATE OR REPLACE VIEW event_analytics AS
SELECT
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  MIN(server_timestamp) as first_occurrence,
  MAX(server_timestamp) as last_occurrence
FROM events
GROUP BY event_name;

-- Create view for daily event summary
CREATE OR REPLACE VIEW daily_event_summary AS
SELECT
  DATE(server_timestamp) as event_date,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM events
GROUP BY DATE(server_timestamp), event_name
ORDER BY event_date DESC, event_count DESC;
