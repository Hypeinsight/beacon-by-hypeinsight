# Beacon - Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 13
- **Redis** >= 6
- **npm** >= 9.0.0

## Step-by-Step Setup

### 1. Install Dependencies

```powershell
cd C:\Users\Isuru\beacon
npm install
```

### 2. Set Up PostgreSQL Database

```powershell
# Create the database (using psql or pgAdmin)
# In psql:
createdb beacon

# Or using PostgreSQL command:
psql -U postgres -c "CREATE DATABASE beacon;"
```

### 3. Configure Environment Variables

```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit .env and update the following:
# - DB_PASSWORD (your PostgreSQL password)
# - IPINFO_API_KEY (sign up at https://ipinfo.io for free tier)
```

**Get IPinfo.io API Key:**
1. Go to https://ipinfo.io/signup
2. Sign up for free account (50,000 requests/month)
3. Copy your API token
4. Add to `.env` file

### 4. Run Database Migrations

```powershell
npm run migrate
```

### 5. Start Redis

```powershell
# If Redis is installed as a service:
redis-server

# Or start Redis with default config:
redis-server --port 6379
```

### 6. Start the Server

**Development mode (with auto-reload):**
```powershell
npm run dev
```

**Production mode:**
```powershell
npm start
```

The server will start on `http://localhost:3000`

## Test the Installation

### 1. Health Check

```powershell
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T18:00:00.000Z",
  "service": "Beacon by Hype Insight"
}
```

### 2. Detailed Health Check

```powershell
curl http://localhost:3000/api/health/detailed
```

This will show the status of PostgreSQL and Redis connections.

### 3. Test Event Tracking

```powershell
curl -X POST http://localhost:3000/api/track/event `
  -H "Content-Type: application/json" `
  -d '{
    "event": "page_view",
    "userId": "user123",
    "sessionId": "session456",
    "properties": {
      "page": "/home"
    }
  }'
```

## What's Next?

Now that Beacon is running, you can:

1. **Review Implementation Status**: Check `IMPLEMENTATION_STATUS.md` for detailed progress
2. **Read Documentation**: Review the specification documents in `/Documentation`
3. **Develop Features**: Start implementing the remaining features (tracking script, site management, etc.)

## Project Structure

```
beacon/
├── config/
│   ├── database.js          # PostgreSQL configuration
│   ├── redis.js             # Redis configuration
│   └── schema.sql           # Database schema (65+ data points)
├── src/
│   ├── controllers/         # Request handlers
│   │   └── trackingController.js
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/              # API routes
│   │   ├── health.js
│   │   └── tracking.js
│   ├── services/            # Business logic
│   │   ├── cacheService.js
│   │   ├── trackingService.js
│   │   └── ipEnrichmentService.js  # ✅ IPinfo.io integration
│   ├── utils/               # Utility functions
│   │   ├── migrate.js
│   │   └── userAgentParser.js  # ✅ Device detection
│   └── server.js            # Main server file
├── Documentation/           # Complete technical specifications
├── .env.example             # Environment template
├── package.json             # Dependencies
├── README.md                # Full documentation
├── IMPLEMENTATION_STATUS.md # Development progress
└── QUICKSTART.md            # This file
```

## Key Features Implemented

✅ **Database Schema**: Complete 65-data-point schema with multi-tenancy  
✅ **IP Enrichment**: IPinfo.io integration with smart caching  
✅ **Visitor Classification**: Business, consumer, bot, privacy user  
✅ **User Agent Parsing**: Device and browser detection  
✅ **API Infrastructure**: Express server with security middleware  
✅ **Health Monitoring**: Basic and detailed health checks  

## Troubleshooting

### PostgreSQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct.

### Redis Connection Error

```
Error: Redis Client Error
```

**Solution**: Start Redis server (`redis-server`)

### IPinfo API Error

```
Error: IP enrichment error
```

**Solution**: Verify your IPINFO_API_KEY in `.env` is valid. Test it at:
```
https://ipinfo.io/8.8.8.8?token=YOUR_TOKEN
```

## Support & Documentation

- **Main Spec**: `Documentation/warp_tracking_solution_specification.md`
- **Dashboard Design**: `Documentation/dashboard_architecture_design.md`
- **IP Enrichment**: `Documentation/IP Enrichment & Company Identification System Design.md`
- **Progress Tracker**: `IMPLEMENTATION_STATUS.md`

## Development Roadmap

**Phase 1 (Current)**: Core tracking infrastructure  
**Phase 2 (Next)**: Site management & tracking script  
**Phase 3**: Authentication & user management  
**Phase 4**: Company insights & B2B features  
**Phase 5**: Analytics & reporting  
**Phase 6**: Destination platform integrations (GA4, Meta, Google Ads)  
**Phase 7**: Dashboard frontend  
**Phase 8**: Monitoring & operations  

---

**Beacon** by Hype Insight - Server-side tracking made simple and powerful.
