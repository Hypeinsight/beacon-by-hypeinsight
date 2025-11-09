# Beacon Technology Stack & Services

This document provides a comprehensive overview of all applications, services, and platforms used in the Beacon tracking solution.

---

## Core Application Stack

### Backend
- **Node.js v18+** - JavaScript runtime for server-side application
- **Express.js** - Web application framework for API endpoints
- **Purpose**: Powers the main tracking API and handles all server-side logic

### Database
- **PostgreSQL 13+** - Primary relational database
- **Provider**: Render.com (Managed PostgreSQL)
- **Plan**: Basic-256mb
- **Region**: Singapore
- **Connection Details**:
  - Host: `dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com`
  - Port: `5432`
  - Database: `beacon_db_9bq8`
  - User: `beacon_db_9bq8_user`
- **Purpose**: 
  - Stores all tracking events with 50+ data points
  - Multi-tenant data (agencies, sites, users)
  - Company identification and B2B tracking
  - Session management
  - Analytics aggregations

### Cache & Session Store
- **Redis 6+** - In-memory data store
- **Provider**: Upstash (Managed Redis with TLS)
- **Connection Details**:
  - Host: `beloved-baboon-34828.upstash.io`
  - Port: `6379`
  - Connection URL: `rediss://default:AYgMAAIncDI1MGZlMzk4MDliY2Y0NjQyOTZkNzE0Zjg5MWMxZDEyMnAyMzQ4Mjg@beloved-baboon-34828.upstash.io:6379`
  - **Note**: Uses `rediss://` (TLS) for secure connection
- **Purpose**:
  - IP enrichment caching (7d business, 24h consumer, 6h VPN)
  - Session management
  - Rate limiting
  - API response caching
  - Performance optimization

### Frontend Dashboard
- **React 19.1+** - UI framework
- **Vite 7.1** - Build tool and dev server (using Rolldown)
- **React Router 7.9** - Client-side routing
- **Tailwind CSS v4** - Utility-first styling
- **Purpose**: 
  - Analytics dashboard
  - Visitor behavior tracking
  - Company insights (B2B)
  - Traffic source analysis
  - Real-time event monitoring

---

## Hosting & Deployment

### Application Hosting
- **Platform**: Render.com
- **Services**:
  1. **beacon-api** (Web Service)
     - Type: Node.js
     - Plan: Starter
     - Region: Oregon
     - URL: `https://beacon-api.onrender.com` (or similar)
     
  2. **beacon-dashboard** (Static Site)
     - Type: Static
     - Build: Vite production build
     - URL: `https://beacon-dashboard.onrender.com` (or similar)

### Database Hosting
- **Provider**: Render.com Managed PostgreSQL
- **Plan**: Basic-256mb (paid tier)
- **Region**: Singapore
- **Backups**: Managed by Render

### Redis Hosting
- **Provider**: Upstash
- **Plan**: Free tier (25MB)
- **Region**: Global edge network
- **Features**: TLS encryption, REST API, Auto-scaling

---

## Third-Party Services

### IP Enrichment
- **Service**: IPinfo.io
- **API Token**: `918d52ca55c6cb`
- **Purpose**:
  - Geolocation (city, region, country, postal code, coordinates)
  - Company identification (B2B visitors)
  - ISP and ASN information
  - VPN/Proxy/Tor detection
  - Visitor classification (business, consumer, bot, privacy_user)
- **Caching Strategy**:
  - Business IPs: 7 days
  - Consumer IPs: 24 hours
  - VPN/Proxy: 6 hours

---

## Development Tools & Libraries

### Backend Dependencies
- **helmet** - Security headers middleware
- **cors** - Cross-Origin Resource Sharing
- **morgan** - HTTP request logger
- **compression** - Response compression
- **express-rate-limit** - API rate limiting
- **express-validator** - Request validation
- **dotenv** - Environment variable management
- **pg** - PostgreSQL client
- **redis** - Redis client
- **axios** - HTTP client for API calls
- **ua-parser-js** - User agent parsing
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **uuid** - Unique ID generation

### Frontend Dependencies
- **axios** - API client
- **lucide-react** - Icon library
- **recharts** - Data visualization
- **date-fns** - Date formatting
- **@tailwindcss/forms** - Form styling
- **@tailwindcss/postcss** - PostCSS integration

### Development Tools
- **nodemon** - Auto-reload during development
- **eslint** - Code linting
- **jest** - Testing framework
- **supertest** - API testing

---

## Client-Side Tracking

### Tracking Script
- **Location**: `public/beacon.js` (production), `public/beacon-dev.js` (development)
- **Distribution**: Served via CDN/static hosting from Render
- **Purpose**:
  - Page view tracking
  - Click event tracking
  - Scroll depth monitoring
  - Form submission tracking
  - E-commerce event tracking
  - UTM parameter capture
  - Session management (client_id, session_id)
  - Device and browser data collection

---

## Architecture Patterns

### Multi-Tenancy
- **Model**: Database-level isolation using agency_id and site_id
- **Tables**: agencies, sites, dashboard_users
- **Access Control**: Role-based (super_admin, agency_admin, manager, client)

### Data Collection
- **Method**: Server-side tracking (bypasses ad blockers)
- **Transport**: HTTPS POST to `/api/track/event`
- **Batching**: Client-side queueing with batch uploads
- **Deduplication**: event_id based

### Caching Strategy
- **Layer 1**: Redis for IP enrichment and frequent queries
- **Layer 2**: PostgreSQL materialized views for analytics
- **Invalidation**: TTL-based with manual override capability

---

## Security

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Storage**: HTTP-only cookies (planned)
- **Expiration**: Configurable via environment variables

### Data Protection
- **PII Hashing**: SHA-256 for email, phone, names
- **Transport**: TLS/HTTPS only
- **CORS**: Configured per deployment
- **Rate Limiting**: 100 requests per 15 minutes (configurable)
- **Headers**: Helmet.js security headers

### Compliance
- **GDPR**: Privacy-first design, hashed PII, data retention policies
- **CCPA**: User data deletion capabilities (planned)

---

## Environment Configuration

### Required Environment Variables

#### Backend (beacon-api on Render)
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://beacon_db_9bq8_user:nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI@dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com/beacon_db_9bq8

# Redis (Upstash)
REDIS_URL=rediss://default:AYgMAAIncDI1MGZlMzk4MDliY2Y0NjQyOTZkNzE0Zjg5MWMxZDEyMnAyMzQ4Mjg@beloved-baboon-34828.upstash.io:6379

# IP Enrichment
IPINFO_API_KEY=918d52ca55c6cb

# Security
CORS_ORIGIN=https://beacon-dashboard.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (beacon-dashboard on Render)
```bash
VITE_API_URL=https://beacon-api.onrender.com
```

#### Local Development
See `.env` file in project root for local development configuration.

---

## Monitoring & Observability

### Health Checks
- **Endpoint**: `/api/health`
- **Detailed**: `/api/health/detailed` (includes DB and Redis status)
- **Purpose**: Uptime monitoring, deployment verification

### Logging
- **Development**: Morgan 'dev' format
- **Production**: Morgan 'combined' format
- **Destination**: stdout (captured by Render)

### Error Tracking
- **Current**: Console logging
- **Planned**: Sentry integration for production error tracking

---

## Performance Optimization

### Response Time
- **Target**: < 200ms for tracking endpoints
- **Techniques**:
  - Connection pooling (PostgreSQL)
  - Redis caching
  - Response compression (gzip)
  - Batch processing

### Scalability
- **Database**: Connection pool (2-10 connections)
- **Cache**: Upstash auto-scaling
- **API**: Horizontal scaling via Render (multiple instances)
- **Rate Limiting**: Per-IP throttling

---

## Version Control & CI/CD

### Repository
- **Platform**: GitHub
- **URL**: https://github.com/Hypeinsight/beacon-by-hypeinsight
- **Branch Strategy**: main branch for production

### Deployment
- **Method**: Git push triggers automatic deployment on Render
- **Build Process**:
  - Backend: `npm install` → `npm start`
  - Frontend: `cd frontend && npm install && npm run build`
- **Rollback**: Via Render dashboard or Git revert

---

## Data Flow

### Event Collection Flow
1. User action on client website
2. beacon.js captures event data
3. HTTP POST to `/api/track/event`
4. Server validates and enriches data:
   - IP enrichment via IPinfo.io (with Redis cache)
   - User agent parsing
   - Session management
5. Data stored in PostgreSQL events table
6. Company and session tables updated
7. Response sent to client

### Analytics Flow
1. Dashboard requests data via `/api/debug/events` or analytics endpoints
2. Server queries PostgreSQL (with Redis cache for frequent queries)
3. Data aggregated and formatted
4. JSON response sent to dashboard
5. React components render visualizations

---

## Cost Breakdown

### Monthly Costs (Estimated)
- **Render Web Service (beacon-api)**: $7/month (Starter plan)
- **Render Static Site (beacon-dashboard)**: Free
- **Render PostgreSQL (Basic-256mb)**: $7/month
- **Upstash Redis**: Free (25MB tier)
- **IPinfo.io**: Free tier (50k requests/month)
- **GitHub**: Free (public repository)

**Total**: ~$14/month

### Scaling Considerations
- Upgrade Render plans for higher traffic
- Upgrade Upstash for larger cache
- Upgrade IPinfo.io for higher enrichment volume

---

## Support & Documentation

### Internal Documentation
- `README.md` - Project overview and setup
- `IMPLEMENTATION_STATUS.md` - Feature completion tracking
- `RENDER_DEPLOYMENT.md` - Deployment guide
- `Documentation/` - Technical specifications and designs

### External Resources
- Node.js: https://nodejs.org/docs
- Express: https://expressjs.com/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/docs/
- Upstash: https://upstash.com/docs/redis
- Render: https://render.com/docs
- IPinfo.io: https://ipinfo.io/developers

---

## Quick Reference

### Service URLs (Production)
- **API**: https://beacon-api.onrender.com
- **Dashboard**: https://beacon-dashboard.onrender.com
- **Health Check**: https://beacon-api.onrender.com/api/health

### Local Development URLs
- **API**: http://localhost:3000
- **Dashboard**: http://localhost:5173

### Key Contacts
- **Development**: Hype Insight Team
- **Support**: support@hypeinsight.com (if applicable)

---

**Last Updated**: 2025-11-09
**Document Version**: 1.0
