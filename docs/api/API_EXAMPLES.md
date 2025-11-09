# Beacon API Examples

Complete examples for all Beacon API endpoints with curl commands and responses.

## Table of Contents

- [Health Checks](#health-checks)
- [Event Tracking](#event-tracking)
- [Site Management](#site-management)
- [Agency Management](#agency-management)

---

## Health Checks

### Basic Health Check

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T02:30:00.000Z"
}
```

### Detailed Health Check

```bash
curl http://localhost:3000/api/health/detailed
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T02:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Event Tracking

### Track Single Event

```bash
curl -X POST http://localhost:3000/api/track/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "page_view",
    "siteId": "abc123def456",
    "clientId": "client-550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "session-550e8400-e29b-41d4-a716-446655440001",
    "timestamp": 1699564800000,
    "pageUrl": "https://example.com/products",
    "pageTitle": "Products - Example Store",
    "referrer": "https://google.com/search?q=example+products",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "summer_sale_2024",
    "utmContent": "ad_variant_a",
    "utmTerm": "buy+products",
    "screenResolution": "1920x1080",
    "viewportSize": "1536x864",
    "devicePixelRatio": 2,
    "language": "en-US",
    "timezone": "America/New_York"
  }'
```

**Response:**
```json
{
  "success": true,
  "eventId": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Track Batch Events

```bash
curl -X POST http://localhost:3000/api/track/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "eventName": "page_view",
        "siteId": "abc123def456",
        "clientId": "client-123",
        "sessionId": "session-456",
        "pageUrl": "https://example.com/"
      },
      {
        "eventName": "button_click",
        "siteId": "abc123def456",
        "clientId": "client-123",
        "sessionId": "session-456",
        "properties": {
          "button_text": "Add to Cart",
          "button_id": "add-to-cart-btn"
        }
      },
      {
        "eventName": "form_submit",
        "siteId": "abc123def456",
        "clientId": "client-123",
        "sessionId": "session-456",
        "properties": {
          "form_name": "contact_form",
          "form_id": "contact"
        }
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "count": 3
}
```

### Get Events by User

```bash
curl "http://localhost:3000/api/track/user/client-123?limit=10&offset=0"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-1",
      "event_name": "page_view",
      "client_id": "client-123",
      "session_id": "session-456",
      "page_url": "https://example.com/",
      "server_timestamp": "2025-11-08T02:30:00.000Z"
    }
  ]
}
```

### Get Events by Session

```bash
curl http://localhost:3000/api/track/session/session-456
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-1",
      "event_name": "page_view",
      "session_id": "session-456",
      "page_url": "https://example.com/",
      "server_timestamp": "2025-11-08T02:30:00.000Z"
    }
  ]
}
```

---

## Site Management

### Create a Site

```bash
curl -X POST http://localhost:3000/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Store",
    "domain": "example.com",
    "agencyId": "agency-550e8400-e29b-41d4-a716-446655440000",
    "config": {
      "trackingEnabled": true,
      "anonymizeIp": false
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "agency_id": "agency-550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Store",
    "domain": "example.com",
    "script_id": "abc123def456",
    "config": {
      "trackingEnabled": true,
      "anonymizeIp": false
    },
    "status": "active",
    "created_at": "2025-11-08T02:30:00.000Z",
    "updated_at": "2025-11-08T02:30:00.000Z"
  }
}
```

### Get All Sites

```bash
# Get all sites
curl http://localhost:3000/api/sites

# Filter by agency
curl "http://localhost:3000/api/sites?agencyId=agency-123"

# Filter by status
curl "http://localhost:3000/api/sites?status=active"

# Pagination
curl "http://localhost:3000/api/sites?limit=20&offset=0"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "site-1",
      "agency_id": "agency-123",
      "name": "Example Store",
      "domain": "example.com",
      "script_id": "abc123def456",
      "status": "active",
      "created_at": "2025-11-08T02:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Site by ID

```bash
curl http://localhost:3000/api/sites/550e8400-e29b-41d4-a716-446655440010

# With agency isolation
curl "http://localhost:3000/api/sites/550e8400-e29b-41d4-a716-446655440010?agencyId=agency-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "agency_id": "agency-123",
    "name": "Example Store",
    "domain": "example.com",
    "script_id": "abc123def456",
    "config": {},
    "status": "active",
    "created_at": "2025-11-08T02:30:00.000Z",
    "updated_at": "2025-11-08T02:30:00.000Z"
  }
}
```

### Update Site

```bash
curl -X PUT http://localhost:3000/api/sites/550e8400-e29b-41d4-a716-446655440010 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Store - Updated",
    "status": "active",
    "config": {
      "trackingEnabled": true,
      "anonymizeIp": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Example Store - Updated",
    "domain": "example.com",
    "config": {
      "trackingEnabled": true,
      "anonymizeIp": true
    },
    "status": "active",
    "updated_at": "2025-11-08T02:35:00.000Z"
  }
}
```

### Delete Site

```bash
curl -X DELETE "http://localhost:3000/api/sites/550e8400-e29b-41d4-a716-446655440010"
```

**Response:**
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

### Get Tracking Script

```bash
curl http://localhost:3000/api/sites/550e8400-e29b-41d4-a716-446655440010/script
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scriptId": "abc123def456",
    "script": "<!-- Beacon Tracking Script -->\n<script>\n  (function(w,d,s,o,f,js,fjs){\n    w['BeaconObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};\n    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];\n    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);\n  }(window,document,'script','beacon','http://localhost:3000/beacon.js'));\n  beacon('init', 'abc123def456');\n</script>"
  }
}
```

### Get Site Statistics

```bash
curl http://localhost:3000/api/sites/550e8400-e29b-41d4-a716-446655440010/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "site": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Example Store",
      "domain": "example.com"
    },
    "stats": {
      "total_events": "15234",
      "total_sessions": "3421",
      "total_visitors": "2987",
      "last_event": "2025-11-08T02:30:00.000Z"
    }
  }
}
```

---

## Agency Management

### Create an Agency

```bash
curl -X POST http://localhost:3000/api/agencies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Agency Inc",
    "email": "contact@marketingagency.com",
    "config": {
      "maxSites": 50,
      "features": ["advanced_analytics", "white_label"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Marketing Agency Inc",
    "email": "contact@marketingagency.com",
    "config": {
      "maxSites": 50,
      "features": ["advanced_analytics", "white_label"]
    },
    "status": "active",
    "created_at": "2025-11-08T02:30:00.000Z",
    "updated_at": "2025-11-08T02:30:00.000Z",
    "apiKey": "beacon_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  },
  "message": "Agency created successfully. Save the API key - it will not be shown again."
}
```

**⚠️ Important:** Save the `apiKey` immediately! It will not be returned again.

### Get All Agencies

```bash
# Get all agencies
curl http://localhost:3000/api/agencies

# Filter by status
curl "http://localhost:3000/api/agencies?status=active"

# Pagination
curl "http://localhost:3000/api/agencies?limit=20&offset=0"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "name": "Marketing Agency Inc",
      "email": "contact@marketingagency.com",
      "config": {},
      "status": "active",
      "created_at": "2025-11-08T02:30:00.000Z",
      "updated_at": "2025-11-08T02:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Agency by ID

```bash
curl http://localhost:3000/api/agencies/550e8400-e29b-41d4-a716-446655440020
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Marketing Agency Inc",
    "email": "contact@marketingagency.com",
    "config": {},
    "status": "active",
    "created_at": "2025-11-08T02:30:00.000Z",
    "updated_at": "2025-11-08T02:30:00.000Z"
  }
}
```

### Update Agency

```bash
curl -X PUT http://localhost:3000/api/agencies/550e8400-e29b-41d4-a716-446655440020 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Agency Inc - Premium",
    "email": "premium@marketingagency.com",
    "config": {
      "maxSites": 100,
      "features": ["advanced_analytics", "white_label", "api_access"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Marketing Agency Inc - Premium",
    "email": "premium@marketingagency.com",
    "config": {
      "maxSites": 100,
      "features": ["advanced_analytics", "white_label", "api_access"]
    },
    "status": "active",
    "updated_at": "2025-11-08T02:35:00.000Z"
  }
}
```

### Delete Agency

```bash
curl -X DELETE http://localhost:3000/api/agencies/550e8400-e29b-41d4-a716-446655440020
```

**Response:**
```json
{
  "success": true,
  "message": "Agency deleted successfully"
}
```

### Regenerate API Key

```bash
curl -X POST http://localhost:3000/api/agencies/550e8400-e29b-41d4-a716-446655440020/regenerate-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Marketing Agency Inc",
    "email": "contact@marketingagency.com",
    "config": {},
    "status": "active",
    "created_at": "2025-11-08T02:30:00.000Z",
    "updated_at": "2025-11-08T02:40:00.000Z",
    "apiKey": "beacon_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"
  },
  "message": "API key regenerated successfully. Save it - it will not be shown again."
}
```

**⚠️ Important:** The old API key is immediately invalidated. Save the new key!

### Get Agency Statistics

```bash
curl http://localhost:3000/api/agencies/550e8400-e29b-41d4-a716-446655440020/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agency": {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "name": "Marketing Agency Inc"
    },
    "stats": {
      "siteCount": 15,
      "eventCount": 234567
    }
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

API endpoints are rate limited to **100 requests per 15 minutes** per IP address.

If you exceed the limit, you'll receive:

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**HTTP Status:** `429 Too Many Requests`

---

## Testing Tips

### Using Postman

1. Import the OpenAPI spec: `docs/api/openapi.yaml`
2. Postman will automatically create a collection with all endpoints
3. Set environment variables for `baseUrl` and `apiKey`

### Using curl with variables

```bash
# Set variables
export BEACON_URL="http://localhost:3000"
export SITE_ID="abc123def456"

# Use in requests
curl "$BEACON_URL/api/sites/$SITE_ID"
```

### Testing with JavaScript

```javascript
// Track event from browser
fetch('http://localhost:3000/api/track/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventName: 'page_view',
    siteId: 'abc123def456',
    clientId: 'client-123',
    sessionId: 'session-456',
    pageUrl: window.location.href,
    pageTitle: document.title
  })
});
```

---

## Next Steps

- Review the [OpenAPI specification](openapi.yaml) for complete API details
- Check the [Installation Guide](../guides/script-installation.md) for tracking script setup
- Read the [Architecture documentation](../architecture/system-architecture.md) for system overview
