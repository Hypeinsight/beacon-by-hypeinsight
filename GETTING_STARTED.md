# Getting Started - Developer Onboarding

Welcome to the Beacon development team! This guide will help you get up and running quickly.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [First-Time Setup](#first-time-setup)
3. [Development Workflow](#development-workflow)
4. [Project Structure](#project-structure)
5. [Common Tasks](#common-tasks)
6. [Common Issues](#common-issues)
7. [Testing](#testing)
8. [Code Standards](#code-standards)
9. [Resources](#resources)

---

## Prerequisites

Before you begin, ensure you have installed:

### Required
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **PostgreSQL** >= 13 ([Download](https://www.postgresql.org/download/))
- **Redis** >= 6 ([Download](https://redis.io/download))
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Recommended
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - GitLens
  - Database Client (for PostgreSQL)
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **DBeaver** for database management
- **RedisInsight** for Redis management

---

## First-Time Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd beacon
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express, PostgreSQL, Redis clients
- Security middleware (Helmet, CORS)
- IP enrichment (axios, ua-parser-js)
- Dev tools (nodemon, jest, eslint)

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and configure:
# - DB_PASSWORD (your PostgreSQL password)
# - IPINFO_API_KEY (get free key from https://ipinfo.io/signup)
```

**Important Environment Variables:**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 3000 |
| `DB_HOST` | PostgreSQL host | Yes | localhost |
| `DB_PORT` | PostgreSQL port | Yes | 5432 |
| `DB_NAME` | Database name | Yes | beacon |
| `DB_USER` | Database user | Yes | postgres |
| `DB_PASSWORD` | Database password | Yes | - |
| `REDIS_HOST` | Redis host | Yes | localhost |
| `REDIS_PORT` | Redis port | Yes | 6379 |
| `IPINFO_API_KEY` | IPinfo.io API key | Yes | - |

### 4. Set Up PostgreSQL Database

```bash
# Create the database
createdb beacon

# Or using psql:
psql -U postgres
CREATE DATABASE beacon;
\q
```

### 5. Run Database Migrations

```bash
npm run migrate
```

This will create all tables, indexes, triggers, and views.

### 6. Start Redis

```bash
# Start Redis server
redis-server

# Or on Windows with WSL:
wsl redis-server
```

### 7. Start the Development Server

```bash
npm run dev
```

You should see:
```
🚀 Beacon server running on http://localhost:3000
📊 Environment: development
Connected to PostgreSQL database
Connected to Redis
```

### 8. Verify Setup

Open another terminal and test the health endpoint:

```bash
curl http://localhost:3000/api/health/detailed
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T18:00:00.000Z",
  "service": "Beacon by Hype Insight",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Development Workflow

### Daily Development

1. **Pull latest changes**
   ```bash
   git pull origin main
   npm install  # In case new dependencies were added
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Make changes and test**
   - Server auto-restarts on file changes (nodemon)
   - Test manually with Postman/curl
   - Run tests: `npm test`

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

6. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub/GitLab
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process or tooling changes

Examples:
```bash
git commit -m "feat: add IP enrichment service"
git commit -m "fix: resolve database connection timeout"
git commit -m "docs: update API documentation"
```

---

## Project Structure

```
beacon/
├── config/               # Configuration files
│   ├── database.js       # PostgreSQL connection
│   ├── redis.js          # Redis connection
│   └── schema.sql        # Database schema (65 data points)
│
├── src/
│   ├── controllers/      # Request handlers
│   │   └── trackingController.js
│   │
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   │
│   ├── routes/           # API routes
│   │   ├── health.js
│   │   └── tracking.js
│   │
│   ├── services/         # Business logic
│   │   ├── trackingService.js
│   │   ├── ipEnrichmentService.js  # ✅ Complete
│   │   └── cacheService.js
│   │
│   ├── utils/            # Utility functions
│   │   ├── migrate.js
│   │   └── userAgentParser.js
│   │
│   └── server.js         # Main entry point
│
├── tests/                # Test files (to be added)
├── logs/                 # Application logs
├── docs/                 # Documentation
│   ├── architecture/     # System design docs
│   ├── api/              # API documentation
│   ├── database/         # Database docs
│   ├── adr/              # Architecture Decision Records
│   └── guides/           # User guides
│
├── Documentation/        # Specification documents
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
├── CHANGELOG.md          # Version history
├── README.md             # Project overview
├── QUICKSTART.md         # Quick setup guide
├── GETTING_STARTED.md    # This file
└── IMPLEMENTATION_STATUS.md  # Development tracker
```

### Key Directories

- **config/**: Database and service configurations
- **src/controllers/**: HTTP request handlers
- **src/services/**: Core business logic (IP enrichment, tracking)
- **src/middleware/**: Express middleware (auth, validation, errors)
- **docs/**: All documentation (architecture, API, guides)

---

## Common Tasks

### Add a New API Endpoint

1. **Create route** in `src/routes/`
2. **Create controller** in `src/controllers/`
3. **Create service** (if needed) in `src/services/`
4. **Register route** in `src/server.js`
5. **Add tests** in `tests/`
6. **Update API docs** in `docs/api/`

Example:
```javascript
// src/routes/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', analyticsController.getOverview);

module.exports = router;
```

### Run Database Migrations

```bash
# Run all migrations
npm run migrate

# Or manually:
node src/utils/migrate.js
```

### Clear Redis Cache

```bash
# Connect to Redis CLI
redis-cli

# Clear all cache
FLUSHALL

# Clear specific pattern
KEYS ip_enrichment:*
DEL ip_enrichment:8.8.8.8
```

### Check Database Schema

```bash
# Connect to PostgreSQL
psql -U postgres -d beacon

# List tables
\dt

# Describe table
\d events

# View indexes
\di

# Quit
\q
```

### Debug IP Enrichment

```bash
# Test IPinfo API directly
curl "https://ipinfo.io/8.8.8.8?token=YOUR_API_KEY"

# Check cache hit rate
redis-cli
KEYS ip_enrichment:*  # See cached IPs
GET ip_enrichment:8.8.8.8  # View cached data
```

---

## Common Issues

### Issue: "Cannot connect to PostgreSQL"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   # Windows
   Get-Service -Name postgresql*

   # macOS/Linux
   pg_ctl status
   ```
2. Verify credentials in `.env`
3. Check if database exists: `psql -l`

---

### Issue: "Redis connection failed"

**Error:**
```
Redis Client Error: connect ECONNREFUSED
```

**Solution:**
1. Start Redis:
   ```bash
   redis-server
   ```
2. Check if Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

---

### Issue: "IPinfo API error"

**Error:**
```
IP enrichment error: Request failed with status code 401
```

**Solution:**
1. Verify `IPINFO_API_KEY` in `.env`
2. Test API key:
   ```bash
   curl "https://ipinfo.io/8.8.8.8?token=YOUR_KEY"
   ```
3. Check quota: https://ipinfo.io/account

---

### Issue: "Port 3000 already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Change port in `.env`: `PORT=3001`
2. Or kill process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- trackingService.test.js
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm test -- --coverage
```

---

## Code Standards

### JSDoc Comments

All functions must have JSDoc comments:

```javascript
/**
 * Enrich IP address with geolocation and company data
 * @param {string} ipAddress - IP address to enrich
 * @returns {Promise<object>} Enriched IP data
 * @throws {Error} If API call fails
 * @example
 * const enriched = await enrichIP('8.8.8.8');
 * console.log(enriched.company_name); // "Google LLC"
 */
const enrichIP = async (ipAddress) => {
  // Implementation
};
```

### Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Return default or throw
  throw new Error('Failed to complete operation');
}
```

### Async/Await

Prefer `async/await` over callbacks or `.then()`:

```javascript
// ✅ Good
async function fetchData() {
  const data = await db.query('SELECT * FROM events');
  return data.rows;
}

// ❌ Avoid
function fetchData() {
  return db.query('SELECT * FROM events').then(data => data.rows);
}
```

---

## Resources

### Documentation
- [System Architecture](docs/architecture/system-architecture.md)
- [API Documentation](docs/api/)
- [Database Schema](docs/database/schema.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)

### External Resources
- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/documentation)
- [IPinfo.io API Docs](https://ipinfo.io/developers)

### Internal Links
- [Main Specification](Documentation/warp_tracking_solution_specification.md)
- [Dashboard Design](Documentation/dashboard_architecture_design.md)

---

## Need Help?

- **Slack**: #beacon-dev channel
- **Email**: dev-team@hypeinsight.com
- **Issues**: Create a GitHub/GitLab issue

---

**Welcome aboard! Happy coding! 🚀**
