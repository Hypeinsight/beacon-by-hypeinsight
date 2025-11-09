# Changelog

All notable changes to Beacon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Enhanced Tracking Service** with full 65-data-point support
  - IP enrichment integration (IPinfo.io)
  - User agent parsing (device, browser, OS detection)
  - Complete field mapping to database schema
  - Comprehensive JSDoc documentation
- **Improved Tracking Controller**
  - Support for all event fields (UTM params, engagement, e-commerce, leads)
  - Proper IP address extraction (proxy-aware)
  - Flexible field naming (camelCase and snake_case)
  - Full JSDoc documentation
- **JavaScript Tracking Script** (beacon.js) ✅
  - Development and minified production versions
  - Automatic tracking: page views, clicks, form submits, scroll depth (25/50/75/100%), engagement time
  - Session management: client_id (2yr), session_id (30min timeout), session_number
  - UTM persistence: All UTM params + gclid/fbclid/ttclid in sessionStorage
  - Device data collection: screen_resolution, viewport_size, device_pixel_ratio, language, timezone
  - Event batching: Queues events, sends batch of 10 or after 5 seconds
  - sendBeacon API for reliable delivery on page unload
  - Passive event listeners for performance optimization
  - Size: ~3KB gzipped
  - Installation guide with WordPress, Shopify, React, GTM examples
  - Interactive test page for validation
- **Site Management API** (Multi-tenant) ✅
  - Full CRUD operations for sites
  - Agency isolation via query parameters
  - Auto-generated script IDs for each site
  - Site statistics endpoint (events, sessions, visitors)
  - Tracking script snippet generation
  - Routes: GET/POST/PUT/DELETE /api/sites, GET /api/sites/:id/script, GET /api/sites/:id/stats
  - Services: sitesService.js with JSDoc documentation
  - Controllers: sitesController.js with proper validation
- **Agency Management API** (Multi-tenant) ✅
  - Full CRUD operations for agencies
  - Secure API key generation with bcrypt hashing
  - API key regeneration endpoint
  - Agency statistics endpoint (site count, event count)
  - Routes: GET/POST/PUT/DELETE /api/agencies, POST /api/agencies/:id/regenerate-key, GET /api/agencies/:id/stats
  - Services: agenciesService.js with JSDoc documentation
  - Controllers: agenciesController.js with proper validation

### Changed
- Tracking service now performs automatic IP enrichment on all events
- Event queries now use `server_timestamp` instead of `timestamp` for ordering
- Server now serves static files from public/ folder (for beacon.js)
- Registered new routes in server.js: /api/sites and /api/agencies

- **OpenAPI 3.0 Documentation** ✅
  - Complete API specification (openapi.yaml)
  - All endpoints documented with schemas, parameters, responses
  - Request/response examples for every endpoint
  - Security schemes (API key authentication)
  - Organized by tags: Health, Tracking, Sites, Agencies
  - API Examples guide (API_EXAMPLES.md) with curl commands
  - Complete request/response examples for all endpoints
  - Error handling documentation
  - Rate limiting documentation
  - Testing tips for Postman, curl, JavaScript

- **Database Documentation** ✅
  - Complete schema documentation (DATABASE_SCHEMA.md)
  - Entity Relationship Diagram (Mermaid)
  - All 6 tables documented: agencies, sites, events, companies, sessions, dashboard_users
  - 65+ event fields organized by category
  - Index documentation for query optimization
  - Sample queries for common analytics patterns
  - Performance considerations and partitioning strategy

- **Architecture Decision Records (ADRs)** ✅
  - ADR 002: Session Management Strategy
    - Client-side session management with sessionStorage
    - 30-minute timeout, session number tracking
    - Stateless architecture for scalability
  - ADR 003: Data Retention Policy
    - 13-month default retention for events
    - Tiered strategy with aggregation
    - GDPR/CCPA compliance (right to erasure, data export)
    - PostgreSQL partitioning strategy
  - ADR 004: Authentication Approach
    - Dual authentication: API keys (agencies) + JWT (dashboard users)
    - Script ID validation for tracking endpoints
    - Role-based access control (RBAC)
    - Security best practices documented

### Planned
- Authentication system with JWT
- Company insights and engagement scoring
- Analytics and reporting endpoints
- Destination platform integrations (GA4, Meta, Google Ads)
- Dashboard frontend (React/Vue)

---

## [0.1.0] - 2025-11-07

### Added
- **Core Infrastructure**
  - Express.js server with security middleware (Helmet, CORS, rate limiting)
  - PostgreSQL database configuration with connection pooling
  - Redis configuration for caching and sessions
  - Environment variable management with dotenv
  - Health check endpoints (basic and detailed)

- **Database Schema** (Complete - 65 data points)
  - `agencies` table for multi-tenant support
  - `sites` table for client website management
  - `events` table with comprehensive tracking fields:
    - Event metadata (event_name, event_id, timestamps)
    - User identification (client_id, session_id, hashed PII)
    - Device & browser data (10 fields)
    - Network & location data from IP enrichment (21 fields)
    - Page & referral data with UTM parameters (14 fields)
    - Engagement metrics (8 fields)
    - E-commerce and lead generation (JSONB)
  - `companies` table for B2B visitor tracking
  - `sessions` table for session analytics
  - `dashboard_users` table for user management
  - Comprehensive indexes for optimized query performance
  - Triggers for automatic timestamp updates
  - Views for event analytics and daily summaries

- **IP Enrichment Service** ✅
  - IPinfo.io API integration for geolocation and company identification
  - Smart caching strategy:
    - Business IPs: 7 days TTL
    - Consumer IPs: 24 hours TTL
    - VPN/Proxy IPs: 6 hours TTL
  - Visitor classification algorithm (business, consumer, bot, privacy_user)
  - Cache statistics and manual invalidation
  - Error handling with fallback data

- **User Agent Parsing** ✅
  - Device detection (desktop, mobile, tablet)
  - Browser identification with version
  - Operating system detection
  - Uses ua-parser-js library

- **API Endpoints**
  - `GET /api/health` - Basic health check
  - `GET /api/health/detailed` - Detailed health check with DB and Redis status
  - `POST /api/track/event` - Single event tracking
  - `POST /api/track/batch` - Batch event tracking
  - `GET /api/track/user/:userId` - Get events by user
  - `GET /api/track/session/:sessionId` - Get events by session

- **Middleware**
  - Error handler with PostgreSQL error mapping
  - Request validation using express-validator
  - Rate limiting (100 requests per 15 minutes)
  - Request logging with Morgan
  - Compression middleware
  - Security headers with Helmet

- **Services**
  - Tracking service for event processing
  - Cache service for Redis operations
  - IP enrichment service (full implementation)
  - User agent parser utility

- **Documentation**
  - README.md with project overview
  - QUICKSTART.md for rapid setup
  - IMPLEMENTATION_STATUS.md for development tracking
  - System architecture documentation with Mermaid diagrams
  - Complete technical specification documents
  - This CHANGELOG.md

- **Configuration**
  - .env.example with all required variables
  - .gitignore for Node.js projects
  - package.json with all dependencies:
    - express, pg, redis, axios
    - ua-parser-js, uuid
    - helmet, cors, compression, morgan
    - express-rate-limit, express-validator
    - bcrypt, jsonwebtoken (for future use)
    - nodemon, jest, eslint (dev dependencies)

### Changed
- N/A (Initial release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Implemented Helmet.js for security headers
- Added CORS protection
- Implemented rate limiting to prevent abuse
- PII fields designed for SHA-256 hashing
- Environment variables for sensitive configuration

---

## Version History

- **[0.1.0]** - 2025-11-07: Initial project setup with core infrastructure

---

## How to Read This Changelog

### Version Numbers
We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward-compatible manner
- **PATCH** version for backward-compatible bug fixes

### Change Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes and improvements

### Release Dates

All dates are in YYYY-MM-DD format (ISO 8601).

---

## Contributing

When adding changes to this changelog:

1. Add your changes under the [Unreleased] section
2. Use the appropriate category (Added, Changed, Fixed, etc.)
3. Write user-facing descriptions (not implementation details)
4. Include ticket/issue numbers if applicable
5. When releasing, move [Unreleased] items to a new version section

---

**Beacon by Hype Insight** - Server-side tracking made simple and powerful.
