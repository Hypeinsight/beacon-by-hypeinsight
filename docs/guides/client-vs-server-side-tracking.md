# Client-Side vs Server-Side Tracking in Beacon

## Overview

Beacon uses a **hybrid approach**: client-side collection + server-side enrichment. This document explains what data is collected where and why.

---

## TL;DR

- **Client-Side (Browser):** Collects 25 fields that only the browser knows (clicks, scrolls, UTMs, device data)
- **Server-Side (Beacon API):** Enriches with 40+ fields from IP address and user agent (location, company, device details)
- **Total:** 65+ data points per event

---

## Client-Side Collection (JavaScript)

### What: 25 Data Points
### Why: Only the browser has access to this information
### How: `beacon.js` script running in the visitor's browser

### Data Collected:

#### 1. User Behavior (5 fields)
- `event_name` - What action occurred (page_view, click, scroll, form_submit)
- `time_on_page` - Seconds spent on page
- `scroll_depth` - How far they scrolled (0-100%)
- `click_target` - What element was clicked
- `form_id` - Which form was submitted

**Why client-side?** The server has no idea when a user clicks a button or scrolls. Only JavaScript in the browser can detect these actions.

#### 2. Session Identity (3 fields)
- `client_id` - Persistent user identifier (stored in localStorage, 2 years)
- `session_id` - Current browsing session (30min timeout)
- `session_number` - How many sessions this user has had

**Why client-side?** Without browser storage, every page view would be a "new visitor." We need to recognize returning users across pages and visits.

#### 3. Page Context (4 fields)
- `page_url` - Current page URL
- `page_title` - Document title
- `page_path` - URL path (/products/shoes)
- `page_referrer` - Where they came from

**Why client-side?** The browser knows the full context of the current page. Single-page apps can change URLs without server knowing.

#### 4. Device Data (5 fields)
- `screen_resolution` - 1920x1080
- `viewport_size` - Visible window size
- `device_pixel_ratio` - Retina/4K displays (1.0, 2.0, etc.)
- `language` - Browser language (en-US)
- `timezone` - User's timezone (America/New_York)

**Why client-side?** The server can't see screen size or viewport. Only the browser knows these details.

#### 5. Marketing Attribution (8 fields)
- `utm_source` - Traffic source (google, facebook)
- `utm_medium` - Marketing medium (cpc, email)
- `utm_campaign` - Campaign name
- `utm_term` - Keyword (for paid search)
- `utm_content` - Ad variant
- `gclid` - Google Click ID
- `fbclid` - Facebook Click ID  
- `ttclid` - TikTok Click ID

**Why client-side?** UTM parameters are in the URL. We persist them in sessionStorage so they're available across the entire session, not just the landing page.

---

## Server-Side Enrichment (Beacon API)

### What: 40+ Data Points
### Why: Server has access to network data & external enrichment APIs
### How: Automatic enrichment when events are received

### Data Added:

#### 1. Network Data (1 field - from HTTP request)
- `ip_address` - Visitor's IP address

**Why server-side?** JavaScript cannot access the user's IP address for security reasons. The server sees it in the HTTP request.

#### 2. IP Enrichment (21 fields - via IPinfo.io API)

**Geographic Data:**
- `ip_city` - New York
- `ip_region` - New York
- `ip_country` - US
- `ip_postal_code` - 10001
- `ip_latitude` - 40.7128
- `ip_longitude` - -74.0060
- `ip_timezone` - America/New_York

**Network Data:**
- `ip_organization` - Comcast Cable
- `ip_asn` - AS7922
- `ip_asn_name` - COMCAST-7922
- `ip_asn_domain` - comcast.com
- `ip_connection_type` - broadband

**B2B Company Identification:**
- `ip_company_name` - Acme Corporation
- `ip_company_domain` - acme.com
- `ip_company_industry` - Technology
- `ip_company_employee_count` - 1000-5000
- `ip_company_revenue` - $100M-$500M

**Privacy/Security Detection:**
- `ip_is_vpn` - true/false
- `ip_is_proxy` - true/false
- `ip_is_tor` - true/false
- `ip_is_hosting` - true/false

**Visitor Classification:**
- `visitor_type` - business/consumer/bot/privacy_user

**Why server-side?** 
1. API calls to IPinfo.io must be made server-side (API key security)
2. IP enrichment is expensive - we cache results in Redis to avoid repeated lookups
3. Business IP detection requires proprietary databases not available client-side

#### 3. User Agent Parsing (10 fields - from HTTP headers)

**Device:**
- `device_category` - mobile/desktop/tablet
- `device_brand` - Apple, Samsung, etc.
- `device_model` - iPhone 14 Pro

**Browser:**
- `browser` - Chrome, Firefox, Safari
- `browser_version` - 118.0.5993.89

**Operating System:**
- `operating_system` - iOS, Windows, macOS, Android
- `os_version` - 17.1

**Additional:**
- `user_agent` - Full UA string (for reference)
- `device_vendor` - Device manufacturer
- `is_bot` - Bot detection

**Why server-side?** While navigator.userAgent is available client-side, parsing it requires a large library (ua-parser-js). It's more efficient to parse once on the server than send the library to every visitor.

#### 4. Event Processing (2 fields)
- `server_timestamp` - Authoritative timestamp (can't be spoofed by client)
- `event_id` - Unique event identifier (prevents duplicates)

**Why server-side?** Client timestamps can be inaccurate (wrong timezone, clock skew). Server timestamp is the source of truth.

---

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│ VISITOR'S BROWSER                                           │
│                                                             │
│  1. User clicks button                                      │
│  2. beacon.js detects click event                           │
│  3. Collects 25 client-side fields:                         │
│     - event_name: "click"                                   │
│     - client_id: "abc-123"                                  │
│     - session_id: "xyz-789"                                 │
│     - page_url: "https://example.com/products"              │
│     - utm_source: "google"                                  │
│     - screen_resolution: "1920x1080"                        │
│     - etc.                                                  │
│                                                             │
│  4. Queues event (batch processing)                         │
│  5. After 5 seconds or 10 events, sends batch to server    │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS POST
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BEACON SERVER                                               │
│                                                             │
│  1. Receives event batch                                    │
│  2. Extracts IP address from HTTP request                   │
│     → ip_address: "203.45.67.89"                            │
│                                                             │
│  3. Calls IPinfo.io API (with Redis caching)                │
│     → ip_city: "San Francisco"                              │
│     → ip_country: "US"                                      │
│     → ip_company_name: "Acme Corp"                          │
│     → visitor_type: "business"                              │
│     → + 17 more IP fields                                   │
│                                                             │
│  4. Parses User-Agent header                                │
│     → device_category: "desktop"                            │
│     → browser: "Chrome"                                     │
│     → operating_system: "Windows"                           │
│     → + 7 more device fields                                │
│                                                             │
│  5. Adds server metadata                                    │
│     → server_timestamp: "2025-11-09T01:00:00Z"             │
│     → event_id: "evt-unique-123"                            │
│                                                             │
│  6. Stores complete event (65+ fields) in PostgreSQL        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ POSTGRESQL DATABASE                                         │
│                                                             │
│  Event stored with all 65+ data points:                     │
│  - 25 client-side fields                                    │
│  - 40+ server-enriched fields                               │
│  - Ready for analytics and B2B lead identification          │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Not 100% Server-Side?

**Q: Why can't we just track everything server-side?**

A: Because the server is **blind to user behavior**:

- ❌ Server can't see clicks (unless they're links to new pages)
- ❌ Server can't see scrolling
- ❌ Server can't see time spent on page
- ❌ Server can't see form interactions (until submission)
- ❌ Server can't see single-page app navigation
- ❌ Server can't track sessions across multiple pages
- ❌ Server can't identify returning visitors

**Server-only tracking = Just page loads** (like 1990s web server logs)

---

## Comparison: Beacon vs Seeka vs Google Analytics

| Solution | Client-Side JS | Server-Side Processing | Data Ownership | Use Case |
|----------|----------------|------------------------|----------------|----------|
| **Beacon** | ✅ Yes (behavior tracking) | ✅ Yes (IP enrichment, B2B identification) | ✅ Your database | Website analytics + B2B lead gen |
| **Seeka** | ❌ No | ✅ Yes (e-commerce event forwarding) | ⚠️ Shared | E-commerce conversion API for ads |
| **Google Analytics** | ✅ Yes | ⚠️ Partial | ❌ Google's servers | General web analytics |

**Key Difference:**
- **Beacon:** Tracks behavior + enriches with B2B data
- **Seeka:** Forwards existing e-commerce events (checkout, purchase) to ad platforms
- **GA4:** Tracks behavior but data goes to Google

---

## Privacy & Compliance

### Client-Side
- ✅ No third-party cookies
- ✅ First-party data (your domain)
- ⚠️ Requires GDPR consent (for EU visitors)
- ✅ No data sent to Google/Facebook/etc.

### Server-Side
- ✅ IP addresses can be anonymized (last octet removal)
- ✅ PII (email, phone) hashed with SHA-256 before storage
- ✅ GDPR right to erasure (delete all data for a user)
- ✅ Data retention policies (auto-delete after 13 months)

---

## Technical Implementation

### Client-Side Script (beacon.js)
```javascript
// Minimal footprint: ~3KB gzipped
// Loads asynchronously (doesn't block page load)
// Uses sendBeacon API for reliable delivery
// Batches events (reduces server requests)
```

### Server-Side API
```javascript
// Node.js + Express
// PostgreSQL for storage
// Redis for IP enrichment caching
// IPinfo.io for IP → Company mapping
```

---

## Common Questions

**Q: Can ad blockers block Beacon?**  
A: Partially. Ad blockers can block the JavaScript, but if you use a first-party subdomain (track.yourdomain.com) and rename the script, it's harder to block.

**Q: What happens if JavaScript is disabled?**  
A: No tracking occurs. This affects <1% of users.

**Q: What if a user has a VPN?**  
A: We detect VPNs and mark them as `is_vpn: true`. The IP enrichment data will be for the VPN exit node, not the user's actual location.

**Q: Can we track users without localStorage?**  
A: Not reliably. Without persistent storage, every page view would be a "new visitor."

**Q: Why not use cookies instead of localStorage?**  
A: Cookies are sent with every HTTP request (bandwidth waste) and face increasing browser restrictions. localStorage is more privacy-friendly.

---

## Summary

### Client-Side = Eyes and Ears
The browser watches what the user does and reports it.

### Server-Side = Brain
The server enriches basic events with intelligence (location, company, device details).

### Together = Complete Picture
65+ data points per event for powerful analytics and B2B lead generation.

---

**Related Documentation:**
- [Installation Guide](script-installation.md)
- [API Documentation](../api/openapi.yaml)
- [Database Schema](../database/DATABASE_SCHEMA.md)
- [ADR 002: Session Management](../adr/002-session-management-strategy.md)