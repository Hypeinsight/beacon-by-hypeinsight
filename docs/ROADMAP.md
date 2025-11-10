# Beacon Product Roadmap
**Living Document - Last Updated: 2025-11-10**

## Vision
Build the most powerful server-side analytics and conversion platform that combines Seeka's ad platform integrations with comprehensive visitor intelligence and B2B lead identification.

---

## Current Status: v2.4.0

### ✅ What We Have Now

#### Core Analytics
- ✅ Universal dataLayer event capture (all platforms)
- ✅ Page view, click, scroll tracking
- ✅ Session management (30min timeout)
- ✅ First-touch & last-touch attribution
- ✅ Traffic source classification
- ✅ Visitor timeline with event history
- ✅ B2B company identification (via IP)
- ✅ 69 data points per event

#### Technical
- ✅ Client-side JavaScript tracker (beacon-dev.js)
- ✅ Server-side enrichment (IP → location, company)
- ✅ PostgreSQL database with full event storage
- ✅ Redis caching for IP lookups
- ✅ React dashboard with visitor intelligence
- ✅ Multi-site support with agency management

#### Integrations
- ✅ GTM dataLayer (reads events automatically)
- ✅ Shopify (via dataLayer)
- ✅ WordPress/WooCommerce (via dataLayer)
- ⚠️ Form tracking (needs GTM configuration)

---

## Phase 1: Match Seeka's Core (Q1 2026)

### 🎯 Goal: Server-Side Conversion API for Ad Platforms

#### Facebook Conversions API
- [ ] Send events to Facebook Conversions API
- [ ] Map dataLayer events → Facebook standard events
- [ ] Hash PII (email, phone) with SHA-256
- [ ] Event deduplication (match client + server events)
- [ ] Test event quality score in Facebook Events Manager

#### Google Ads Enhanced Conversions
- [ ] Send events to Google Ads API
- [ ] GCLID tracking and association
- [ ] Enhanced conversions with hashed email
- [ ] Conversion value attribution

#### TikTok Events API
- [ ] Send events to TikTok Events API
- [ ] TTCLID tracking
- [ ] Standard event mapping

#### Snapchat Conversions API
- [ ] Send events to Snapchat CAPI
- [ ] Event mapping and attribution

#### Configuration UI
- [ ] Ad platform connection settings page
- [ ] API key management (encrypted storage)
- [ ] Event mapping configuration
- [ ] Test mode with event preview
- [ ] Per-site ad platform toggles

**Success Criteria:**
- Beacon can replace Seeka for Shopify/WooCommerce stores
- Ad platforms show improved conversion tracking
- Attribution window matches or exceeds Seeka

---

## Phase 2: Go Beyond Seeka (Q2 2026)

### 🎯 Goal: Intelligent Automation & Enrichment

#### Advanced Attribution
- [ ] Multi-touch attribution models (linear, time-decay, position-based)
- [ ] Cross-device tracking
- [ ] Offline conversion upload
- [ ] Revenue attribution by campaign/source

#### Smart Audience Building
- [ ] Automatic custom audience creation in Facebook/Google
  - High-intent visitors (90%+ scroll, 3+ page views)
  - Cart abandoners
  - Product viewers (specific categories)
  - B2B companies (by industry, size)
- [ ] Lookalike audience generation
- [ ] Audience sync every 24 hours

#### Predictive Intelligence
- [ ] Lead scoring (ML model)
- [ ] Purchase intent prediction
- [ ] Churn prediction for SaaS
- [ ] Best time to retarget

#### B2B Enrichment (Beyond IP)
- [ ] Clearbit integration (company enrichment)
- [ ] LinkedIn company matching
- [ ] Firmographic data (funding, tech stack)
- [ ] Decision-maker identification

---

## Phase 3: Platform Differentiators (Q3 2026)

### 🎯 Goal: Features Seeka Can't Do

#### Real-Time Alerts
- [ ] Slack/Email notifications when:
  - High-value company visits site
  - Cart abandonment (>$X value)
  - Form submission from target account
  - Competitor domain visits

#### AI-Powered Insights
- [ ] Automatic anomaly detection
- [ ] Campaign performance recommendations
- [ ] Budget optimization suggestions
- [ ] A/B test result analysis

#### Advanced Segmentation
- [ ] Behavioral cohorts
- [ ] RFM analysis (Recency, Frequency, Monetary)
- [ ] Custom segment builder
- [ ] Segment-based retargeting

#### Privacy & Compliance
- [ ] GDPR consent management
- [ ] CCPA compliance tools
- [ ] Data retention policies (auto-delete)
- [ ] PII anonymization controls
- [ ] Cookie-less tracking mode

---

## Phase 4: Enterprise Features (Q4 2026)

### 🎯 Goal: Scale to Large Organizations

#### Multi-User & Permissions
- [ ] Role-based access control (Admin, Analyst, Viewer)
- [ ] Team collaboration
- [ ] Audit logs

#### Advanced Reporting
- [ ] Custom dashboards
- [ ] Scheduled reports (email/Slack)
- [ ] Data export (CSV, API)
- [ ] SQL query interface

#### Integrations Ecosystem
- [ ] Zapier integration
- [ ] Salesforce CRM sync
- [ ] HubSpot integration
- [ ] Webhooks for custom integrations
- [ ] API for third-party tools

#### Performance & Scale
- [ ] Event streaming (10K+ events/sec)
- [ ] Data warehousing (BigQuery/Snowflake export)
- [ ] CDN for tracker script
- [ ] Multi-region deployment

---

## Technical Debt & Infrastructure

### Ongoing Improvements
- [ ] Remove debug console logs from production
- [ ] Filter out noisy dataLayer events (gtm.click, user_engagement, scroll)
- [ ] Production vs development script versions
- [ ] Script versioning without manual cache busting
- [ ] Error monitoring (Sentry integration)
- [ ] Performance monitoring (API response times)
- [ ] Automated testing (E2E, integration)
- [ ] CI/CD pipeline improvements

---

## Competitive Analysis

### Seeka
**What they do well:**
- Simple setup for Shopify
- Reliable conversion forwarding
- Good documentation

**Where we'll beat them:**
- ✅ We have full analytics (they don't)
- ✅ We have B2B identification (they don't)
- ⏳ We'll add conversion API (match)
- 🎯 We'll add smart audiences (exceed)
- 🎯 We'll add predictive intelligence (exceed)

### Segment
**What they do well:**
- 300+ integrations
- Enterprise-grade reliability

**Where we'll differentiate:**
- ✅ B2B company identification (they charge extra)
- 🎯 Built-in ad platform optimization (they just forward)
- 🎯 Predictive intelligence (they don't have)
- 💰 Lower cost (we're self-hosted)

### Google Analytics 4
**What they do well:**
- Free for most use cases
- Deep Google Ads integration

**Where we'll differentiate:**
- ✅ You own the data (not Google)
- ✅ B2B company identification
- ✅ Better privacy compliance
- 🎯 Conversion API for all platforms (not just Google)

---

## Success Metrics

### Phase 1 Success (Match Seeka)
- 5 paying customers using conversion API
- 99%+ event delivery success rate
- Facebook Event Quality Score: Good or Excellent

### Phase 2 Success (Beyond Seeka)
- 10 customers using smart audiences
- 3 case studies showing improved ROAS
- Lead scoring accuracy >80%

### Phase 3 Success (Market Leader)
- 50 paying customers
- $10K+ MRR
- Featured in marketing technology blogs

---

## Notes

**What makes Beacon unique:**
1. **Full analytics + conversion optimization** (not just relay)
2. **B2B intelligence built-in** (not an add-on)
3. **You own the data** (not vendor lock-in)
4. **Privacy-first** (GDPR/CCPA ready)
5. **Open source potential** (community contributions)

**Our moat:**
- Server-side architecture (harder to build than client-side)
- B2B enrichment integrations (IPinfo, Clearbit)
- ML models for prediction (improves with data)
- Multi-platform conversion APIs (each integration is work)

---

## Contributing to This Roadmap

This is a living document. Update it as:
- Features are completed (move to ✅)
- Priorities change
- New competitive intelligence emerges
- Customer feedback arrives

**Last major update:** 2025-11-10 - Added Phase 1 conversion API details
