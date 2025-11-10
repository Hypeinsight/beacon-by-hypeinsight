# Beacon Technology Stack

**Last Updated: 2025-11-10**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT-SIDE (Browser)                                       │
│  - beacon-dev.js (Vanilla JavaScript)                       │
│  - localStorage for client_id, session_id                   │
│  - Captures user behavior + dataLayer events                │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│ SERVER-SIDE (Node.js API)                                   │
│  - Express.js REST API                                      │
│  - IP enrichment (IPinfo.io)                                │
│  - User-agent parsing                                       │
│  - Event storage in PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE & CACHE                                            │
│  - PostgreSQL (event storage)                               │
│  - Redis (IP lookup caching)                                │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND DASHBOARD (React)                                  │
│  - React 18 + Vite                                          │
│  - React Router                                             │
│  - Tailwind CSS                                             │
│  - Lucide Icons                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Client-Side Tracker

### JavaScript (`beacon-dev.js`)
- **Language:** Vanilla JavaScript (ES5 compatible)
- **Size:** ~15KB uncompressed, ~3KB gzipped
- **Dependencies:** Zero (no external libraries)
- **Browser Support:** All modern browsers + IE11

#### Key Features:
- Event capture (clicks, scrolls, page views)
- DataLayer listener (GTM, Shopify, custom)
- Session management (localStorage)
- Batch event sending (reduce server load)
- Uses `sendBeacon` API for reliable delivery

#### Storage:
- **localStorage:** `client_id` (2 year expiry), `session_time`, `first_touch`
- **sessionStorage:** `session_id`, `last_touch`

---

## Backend API

### Runtime
- **Platform:** Node.js v18+
- **Framework:** Express.js 4.x
- **Language:** JavaScript (ES6+)

### Core Dependencies

#### Web Framework
- `express` - Web server
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `compression` - Response compression
- `express-rate-limit` - Rate limiting
- `express-validator` - Request validation

#### Database
- `pg` - PostgreSQL client
- `redis` - Redis client for caching

#### Enrichment Services
- Custom IPinfo.io integration (HTTP API)
- `ua-parser-js` - User agent parsing

#### Utilities
- `dotenv` - Environment variables
- `morgan` - HTTP request logging
- `uuid` - UUID generation

### API Structure
```
/api
  /track
    POST /event          - Single event tracking
    POST /batch          - Batch event tracking
  /sites
    GET /sites           - List all sites
    GET /sites/:id       - Get site details
    POST /sites          - Create new site
  /visitors
    GET /visitors        - List visitors
    GET /visitors/:id    - Visitor detail
  /companies
    GET /companies       - B2B company list
  /agencies
    GET /agencies        - Agency management
  /health
    GET /health          - Health check
```

---

## Database

### PostgreSQL 14+
**Why PostgreSQL:** 
- JSONB support (flexible event properties)
- Full-text search
- JSON aggregation
- Strong data integrity

#### Key Tables:
```sql
events              - All tracking events (65+ columns)
sites               - Client websites
agencies            - Agency/client management
visitors            - Aggregated visitor data (future)
```

#### Performance:
- Indexes on: `client_id`, `session_id`, `timestamp`, `site_id`
- Partitioning: By date (future - for high volume)
- JSONB GIN indexes on `properties` column

---

## Cache Layer

### Redis 6+
**Why Redis:**
- Fast IP enrichment lookup caching
- Session data (future)
- Rate limiting counters

#### Data Stored:
- `ip:{address}` - Enriched IP data (24hr TTL)
- Rate limit counters (15min TTL)

---

## Frontend Dashboard

### React Application
- **Framework:** React 18.x
- **Build Tool:** Vite 4.x
- **Bundler:** Rollup (via Vite)
- **Router:** React Router v6

### UI Libraries
- **Styling:** Tailwind CSS 3.x
- **Icons:** Lucide React
- **Components:** Custom (no UI library)

### State Management
- React built-in (useState, useEffect)
- No Redux/Zustand needed yet (simple state)

### Data Fetching
- Native `fetch` API
- No axios/SWR yet (future consideration)

### Build Output
- Static HTML/CSS/JS
- Deployed to Render (static hosting)

---

## Deployment & Infrastructure

### Hosting
**Platform:** Render.com
- **API:** Web Service (Node.js)
- **Frontend:** Static Site
- **Database:** PostgreSQL (managed)
- **Redis:** Managed Redis instance

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# API Keys
IPINFO_API_KEY=...

# Server Config
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Deployment Flow
```
GitHub → Render Auto-Deploy
  - Push to main branch
  - Render builds and deploys automatically
  - ~2-3 minute deploy time
```

---

## Development Tools

### Code Quality
- ESLint (future)
- Prettier (future)
- Git hooks (future)

### Testing
- None yet (to be added)
- Future: Jest, Cypress

### Monitoring
- Console logging (development)
- Future: Sentry for error tracking
- Future: DataDog/New Relic for APM

---

## External Services

### IPinfo.io
- **Purpose:** IP → Location, Company enrichment
- **Plan:** Free tier (50K requests/month)
- **Caching:** Redis (reduces API calls by ~90%)

### Future Integrations
- Clearbit (B2B enrichment)
- Facebook Conversions API
- Google Ads API
- TikTok Events API

---

## Security

### Client-Side
- No cookies (uses localStorage)
- HTTPS only
- No PII collected by default
- CSP headers (via Helmet)

### Server-Side
- Rate limiting (100 req/15min per IP)
- Input validation (express-validator)
- SQL injection protection (parameterized queries)
- XSS protection (Helmet)
- CORS configured

### Secrets Management
- Environment variables (never committed)
- API keys encrypted at rest (future)

---

## Performance

### Client-Side
- Script size: 3KB gzipped
- Async loading (non-blocking)
- Batch events (reduce requests)
- localStorage (fast reads)

### Server-Side
- Redis caching (IP lookups)
- Connection pooling (PostgreSQL)
- Gzip compression
- Response time: <100ms (avg)

### Database
- Indexed queries
- JSONB for flexible storage
- Batch inserts for multiple events

---

## Scalability Considerations

### Current Limits (Render Free Tier)
- ~10K events/day
- ~1K concurrent visitors
- Single region (US)

### Future Scaling Plan
- CDN for tracker script (Cloudflare)
- Load balancing (multiple API servers)
- Database read replicas
- Event queue (RabbitMQ/Kafka)
- Multi-region deployment

---

## Development Setup

### Prerequisites
```bash
Node.js 18+
PostgreSQL 14+
Redis 6+
```

### Local Development
```bash
# Backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with local credentials
```

---

## Technology Decisions & Rationale

### Why Node.js?
- Fast I/O for high-volume event ingestion
- JavaScript everywhere (client + server)
- Large ecosystem (npm)
- Easy deployment

### Why PostgreSQL?
- JSONB for flexible event data
- Strong consistency
- Full-text search
- Better for analytics than MySQL

### Why Redis?
- Fast caching for IP lookups
- Future: real-time features (WebSockets)

### Why React?
- Component reusability
- Large ecosystem
- Fast development
- Easy to hire developers

### Why Vanilla JS for Tracker?
- Zero dependencies = smaller size
- No build step needed
- Maximum compatibility
- Full control over code

---

## Version History

### v2.4.0 (Current)
- Universal dataLayer event capture
- First-touch & last-touch attribution
- Traffic source classification
- B2B company identification
- 69 data points per event

### v2.3.x
- Fixed timestamp format (ISO8601)
- Fixed CORS issues
- Immediate dataLayer event sending

### v2.0.x
- Added dataLayer tracking
- Multiple format support (GTM args + objects)

### v1.x
- Basic tracking (page views, clicks, scrolls)
- Session management
- IP enrichment

---

## Future Technology Upgrades

### Short-Term (3-6 months)
- [ ] TypeScript for backend
- [ ] Jest for testing
- [ ] Sentry for error tracking
- [ ] Prettier + ESLint

### Medium-Term (6-12 months)
- [ ] GraphQL API (supplement REST)
- [ ] WebSockets for real-time updates
- [ ] Event streaming (Kafka)
- [ ] Machine learning pipeline (Python)

### Long-Term (12+ months)
- [ ] Kubernetes deployment
- [ ] Multi-region architecture
- [ ] Data warehouse (ClickHouse/BigQuery)
- [ ] CDN for global script delivery

---

**Maintained by:** Hype Insight Engineering Team
**Questions?** Create an issue in the GitHub repo
