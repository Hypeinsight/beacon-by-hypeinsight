# Beacon

**By Hype Insight**

A powerful script-based, server-side tracking solution built with Node.js, Express, PostgreSQL, and Redis. Beacon restores up to 76% of hidden user behavior by bypassing browser privacy restrictions through server-side data collection.

> **Based on:** Warp Server-Side Tracking Solution Specification v1.0

## Features

### Core Tracking
- 🚀 **Server-side event collection** - Bypasses ad blockers and browser restrictions
- 📊 **Comprehensive data capture** - 50+ data points per event
- ⚡ **Batch event processing** - High-volume tracking support
- 🔍 **Multi-tenant architecture** - Agency and client isolation
- 📈 **Complete event types** - Page views, e-commerce, lead generation, engagement

### IP Enrichment & Company Identification
- 🌍 **IPinfo.io integration** - Geolocation and company identification
- 🏢 **B2B visitor tracking** - Identify companies visiting your sites
- 🎯 **Visitor classification** - Business, consumer, bot, privacy user
- ⚡ **Smart caching** - 7-day cache for business IPs, 24h for consumers
- 📍 **Geographic insights** - City, region, country-level data

### Dashboard & Analytics
- 📱 **Centralized dashboard** - Monitor all client sites in one place
- 📈 **Real-time metrics** - Live event stream and statistics
- 🏢 **Company insights** - Lead scoring and engagement tracking
- 📊 **Traffic analysis** - Sources, devices, pages, funnels
- 🔔 **Data flow monitoring** - Pipeline health and error tracking

### Security & Compliance
- 🔒 **GDPR/CCPA compliant** - Privacy-first design
- 🔑 **Role-based access** - Super admin, agency admin, manager, client
- 🛡️ **Security headers** - Helmet.js, CORS, rate limiting
- 🔐 **Hashed PII** - SHA-256 hashing for sensitive data

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **Additional:** Helmet, CORS, Morgan, Compression

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6
- npm >= 9.0.0

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd beacon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database and Redis connections.

4. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb beacon
   
   # Run migrations
   npm run migrate
   ```

5. **Start Redis:**
   ```bash
   redis-server
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Run Tests
```bash
npm test
```

### Run Linter
```bash
npm run lint
```

## API Endpoints

### Health Check
```bash
GET /api/health
GET /api/health/detailed
```

### Track Event
```bash
POST /api/track/event
Content-Type: application/json

{
  "event": "page_view",
  "userId": "user123",
  "sessionId": "session456",
  "properties": {
    "page": "/home",
    "referrer": "https://google.com"
  },
  "timestamp": "2025-11-07T18:00:00Z"
}
```

### Batch Track Events
```bash
POST /api/track/batch
Content-Type: application/json

{
  "events": [
    {
      "event": "button_click",
      "userId": "user123",
      "properties": { "button": "signup" }
    },
    {
      "event": "form_submit",
      "userId": "user123",
      "properties": { "form": "newsletter" }
    }
  ]
}
```

### Get Events by User
```bash
GET /api/track/user/:userId?limit=50&offset=0
```

### Get Events by Session
```bash
GET /api/track/session/:sessionId?limit=50&offset=0
```

## Project Structure

```
beacon/
├── config/
│   ├── database.js          # PostgreSQL configuration
│   ├── redis.js             # Redis configuration
│   └── schema.sql           # Database schema
├── src/
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models (future)
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── server.js            # Main server file
├── tests/                   # Test files
├── logs/                    # Application logs
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
└── README.md               # This file
```

## Configuration

Key environment variables in `.env`:

- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL settings
- `REDIS_HOST`, `REDIS_PORT` - Redis settings
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` - Rate limiting
- `CORS_ORIGIN` - CORS configuration

## Database Schema

The main `events` table includes:
- Event tracking with user and session IDs
- JSONB properties for flexible metadata
- Timestamps and request metadata
- Optimized indexes for queries

Additional tables:
- `users` - User metadata
- `sessions` - Session tracking

Analytics views:
- `event_analytics` - Event statistics
- `daily_event_summary` - Daily aggregations

## Performance

- Redis caching for frequently accessed data
- Connection pooling for PostgreSQL
- Rate limiting to prevent abuse
- Compression middleware for responses
- Batch processing for high-volume tracking

## Security

- Helmet.js for security headers
- CORS protection
- Request validation
- Rate limiting
- Environment variable management

## Development

### Adding New Routes
1. Create controller in `src/controllers/`
2. Add route in `src/routes/`
3. Register route in `src/server.js`

### Adding New Services
1. Create service in `src/services/`
2. Import in controllers as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please contact Hype Insight support.

---

**Beacon** - Server-side tracking made simple and powerful.
