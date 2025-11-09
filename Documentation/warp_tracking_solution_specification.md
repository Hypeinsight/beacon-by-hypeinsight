# Warp Server-Side Tracking Solution: Complete Technical Specification

**Author:** Manus AI  
**Date:** November 7, 2025  
**Version:** 1.0

---

## Executive Summary

This document provides a comprehensive technical specification for building a script-based, server-side tracking solution on Warp, inspired by the capabilities of Seeka. The solution addresses the critical challenges facing digital marketers today: the loss of tracking data due to browser privacy restrictions, the inability to accurately attribute conversions, and the lack of visibility into high-value business visitors.

The proposed solution features three core components: a lightweight JavaScript tracking script deployed on client websites, a robust server-side event processing pipeline with IP-to-company enrichment, and a centralized dashboard for monitoring data flow across all client sites. By collecting data on the server rather than relying on browser-based pixels, the solution bypasses ad blockers and privacy restrictions, restoring up to 76% of hidden user behavior.

The system will leverage **IPinfo.io** for IP enrichment, providing company identification for B2B lead generation. The centralized dashboard will offer real-time visibility into tracking performance, data quality, and visitor insights across all client sites. The solution is designed to be multi-tenant, scalable, and compliant with GDPR and CCPA regulations.

---

## 1. Market Context & Problem Statement

### The Tracking Crisis

The digital marketing landscape has undergone a fundamental shift since Apple introduced App Tracking Transparency (ATT) in iOS 14.5 in April 2021. This change, which requires apps to ask users for permission to track their activity across other companies' apps and websites, has had a profound impact on advertising effectiveness. According to industry reports, 96% of iOS users have opted out of third-party tracking, creating a massive blind spot for advertisers who rely on conversion data to optimize their campaigns.

The problem extends beyond iOS. Browser vendors including Safari, Firefox, and increasingly Chrome are implementing privacy features that block or limit third-party cookies and tracking pixels. These restrictions mean that traditional client-side tracking methods are becoming increasingly unreliable, with some advertisers reporting data loss of up to 76% compared to pre-ATT levels.

### The Impact on Ad Performance

When advertising platforms like Meta, Google Ads, and TikTok lack complete conversion data, their machine learning algorithms cannot effectively optimize campaigns. This leads to wasted ad spend, poor targeting, incomplete retargeting audiences, and inaccurate lookalike modeling. For e-commerce businesses, this translates directly to reduced return on ad spend (ROAS) and lost revenue.

### The Server-Side Solution

Server-side tracking solves these problems by moving data collection from the browser to the server. Instead of relying on third-party pixels that can be blocked, a first-party script sends event data to a server you control, which then forwards enriched data to advertising platforms via server-to-server APIs. Because this data originates from your domain and is sent directly from your server, it bypasses browser restrictions and provides a complete, accurate picture of user behavior.

---

## 2. Solution Overview

### Architecture Philosophy

The Warp tracking solution is built on three fundamental principles:

**First-Party Data Ownership.** All tracking data is collected as a first party, meaning your clients own and control their data. This not only ensures compliance with privacy regulations but also creates a competitive advantage by building a proprietary data asset.

**Server-Side Processing.** By processing events on the server rather than in the browser, the solution eliminates the vulnerabilities of client-side tracking. Server-side processing also enables data enrichment, validation, and transformation before sending to destination platforms.

**Script-Based Deployment.** Unlike WordPress plugins that can create compatibility issues or security concerns, the solution uses a lightweight JavaScript snippet that can be deployed on any website, regardless of platform. This makes it ideal for agencies managing diverse client portfolios.

### Core Components

The solution consists of three interconnected components:

**Tracking Script.** A lightweight JavaScript snippet embedded on client websites captures user interactions and sends them to the Warp tracking server. The script is designed to be non-blocking, ensuring it does not impact page load performance.

**Event Processing Pipeline.** The server-side pipeline receives events from the tracking script, validates and enriches the data (including IP-to-company identification), and routes events to destination platforms like GA4, Meta, and Google Ads via their server-side APIs.

**Centralized Dashboard.** A web-based dashboard provides real-time visibility into tracking performance across all client sites, including data flow monitoring, company visitor identification, and automated reporting.

---

## 3. Data Collection Specification

This section provides a comprehensive list of all data points that should be collected by the Warp tracking solution.

### 3.1 User Identification Data

User identification is critical for tracking users across sessions and devices. The solution should collect the following identifiers:

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `client_id` | Unique identifier for the user | First-party cookie or localStorage | Yes | Generated on first visit, persists across sessions |
| `user_id` | Authenticated user ID | Website database (if user is logged in) | No | Links anonymous behavior to known user |
| `session_id` | Unique identifier for the current session | Generated per session | Yes | New session after 30 minutes of inactivity |
| `email` (hashed) | SHA-256 hash of user email | Form submissions, checkout | No | For enhanced matching in ad platforms |
| `phone` (hashed) | SHA-256 hash of user phone number | Form submissions, checkout | No | For enhanced matching in ad platforms |
| `first_name` (hashed) | SHA-256 hash of first name | Form submissions, checkout | No | For enhanced matching in ad platforms |
| `last_name` (hashed) | SHA-256 hash of last name | Form submissions, checkout | No | For enhanced matching in ad platforms |
| `address` (hashed) | SHA-256 hash of address components | Checkout | No | For enhanced matching in ad platforms |

**Implementation Notes:** The `client_id` should be a UUID v4 generated on the first visit and stored in a first-party cookie with a 2-year expiration. The `session_id` should be regenerated after 30 minutes of inactivity. All personally identifiable information (PII) must be hashed using SHA-256 before transmission to comply with privacy regulations.

### 3.2 Device & Browser Data

Device and browser information helps understand the user's technical context and enables device-based segmentation.

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `user_agent` | Full user agent string | HTTP header | Yes | Contains browser, OS, and device info |
| `device_category` | Desktop, mobile, or tablet | Parsed from user agent | Yes | Categorized on server |
| `browser` | Browser name and version | Parsed from user agent | Yes | e.g., Chrome 119, Safari 17 |
| `browser_version` | Major browser version | Parsed from user agent | Yes | For compatibility tracking |
| `operating_system` | OS name and version | Parsed from user agent | Yes | e.g., Windows 11, iOS 17 |
| `screen_resolution` | Screen width x height in pixels | JavaScript `screen.width` and `screen.height` | No | e.g., 1920x1080 |
| `viewport_size` | Viewport width x height in pixels | JavaScript `window.innerWidth` and `window.innerHeight` | No | Actual visible area |
| `device_pixel_ratio` | Device pixel ratio | JavaScript `window.devicePixelRatio` | No | For retina displays |
| `language` | Browser language | JavaScript `navigator.language` | Yes | e.g., en-US |
| `timezone` | User timezone | JavaScript `Intl.DateTimeFormat().resolvedOptions().timeZone` | Yes | e.g., America/New_York |

**Implementation Notes:** The user agent should be captured from the HTTP request header on the server side. Client-side JavaScript should supplement this with additional properties like screen resolution and viewport size. Device categorization should use a library like `ua-parser-js` on the server.

### 3.3 Network & Location Data

Network and location data enables geographic segmentation and, critically, company identification for B2B tracking.

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `ip_address` | User's IP address | HTTP request | Yes | Captured on server, never sent to client |
| `ip_city` | City from IP lookup | IPinfo.io API | Yes | e.g., San Francisco |
| `ip_region` | State/region from IP lookup | IPinfo.io API | Yes | e.g., California |
| `ip_country` | Country code from IP lookup | IPinfo.io API | Yes | ISO 3166-1 alpha-2 code (e.g., US) |
| `ip_postal_code` | Postal code from IP lookup | IPinfo.io API | No | May not be available for all IPs |
| `ip_latitude` | Latitude from IP lookup | IPinfo.io API | No | For mapping |
| `ip_longitude` | Longitude from IP lookup | IPinfo.io API | No | For mapping |
| `ip_timezone` | Timezone from IP lookup | IPinfo.io API | Yes | e.g., America/Los_Angeles |
| `ip_organization` | Organization/ISP name | IPinfo.io API | Yes | e.g., Google LLC or Comcast Cable |
| `ip_asn` | Autonomous System Number | IPinfo.io API | Yes | e.g., AS15169 |
| `ip_asn_name` | ASN organization name | IPinfo.io API | Yes | e.g., Google LLC |
| `ip_asn_domain` | Domain of ASN organization | IPinfo.io API | No | e.g., google.com |
| `ip_company_name` | Company name (if business IP) | IPinfo.io API | No | Only for business IPs |
| `ip_company_domain` | Company domain (if business IP) | IPinfo.io API | No | e.g., microsoft.com |
| `ip_connection_type` | Connection type | IPinfo.io API | No | business, residential, hosting |
| `ip_is_vpn` | Whether IP is a VPN | IPinfo.io API | Yes | Boolean flag |
| `ip_is_proxy` | Whether IP is a proxy | IPinfo.io API | Yes | Boolean flag |
| `ip_is_tor` | Whether IP is Tor exit node | IPinfo.io API | Yes | Boolean flag |
| `ip_is_hosting` | Whether IP is hosting/datacenter | IPinfo.io API | Yes | Boolean flag |
| `visitor_type` | Classified visitor type | Derived from IP data | Yes | business, consumer, bot, privacy_user |

**Implementation Notes:** The IP address must be captured on the server from the HTTP request. Never send the raw IP address to the client. The IP enrichment should be performed asynchronously after the event is received, with results cached in Redis for 24 hours to 7 days depending on visitor type. The `visitor_type` classification should follow the logic outlined in Section 4.3.

### 3.4 Page & Referral Data

Page and referral data tracks the user's navigation path and traffic sources.

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `page_url` | Full URL of current page | JavaScript `window.location.href` | Yes | Includes protocol, domain, path, query |
| `page_path` | Path portion of URL | Parsed from `page_url` | Yes | e.g., /products/shoes |
| `page_title` | Page title | JavaScript `document.title` | Yes | e.g., Men's Running Shoes |
| `page_hostname` | Domain of current page | JavaScript `window.location.hostname` | Yes | e.g., example.com |
| `page_referrer` | Full URL of referring page | JavaScript `document.referrer` | Yes | Empty for direct traffic |
| `referrer_hostname` | Domain of referring page | Parsed from `page_referrer` | No | e.g., google.com |
| `utm_source` | UTM source parameter | URL query parameter | No | e.g., google, facebook |
| `utm_medium` | UTM medium parameter | URL query parameter | No | e.g., cpc, email |
| `utm_campaign` | UTM campaign parameter | URL query parameter | No | e.g., summer_sale |
| `utm_term` | UTM term parameter | URL query parameter | No | e.g., running shoes |
| `utm_content` | UTM content parameter | URL query parameter | No | e.g., ad_variant_a |
| `gclid` | Google Click ID | URL query parameter | No | For Google Ads attribution |
| `fbclid` | Facebook Click ID | URL query parameter | No | For Meta attribution |
| `ttclid` | TikTok Click ID | URL query parameter | No | For TikTok attribution |

**Implementation Notes:** All URL parameters should be captured and persisted for the duration of the session. UTM parameters and click IDs should be stored in sessionStorage to maintain attribution even after the user navigates to pages without these parameters.

### 3.5 Engagement & Behavior Data

Engagement data measures how users interact with the website.

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `engagement_time_msec` | Time user was actively engaged (ms) | Calculated from focus/blur events | Yes | Only counts time when tab is active |
| `scroll_depth_percent` | Percentage of page scrolled | Calculated from scroll position | No | Max scroll depth reached |
| `scroll_depth_pixels` | Pixels scrolled from top | JavaScript scroll position | No | Absolute scroll position |
| `time_on_page_sec` | Total time spent on page (seconds) | Calculated from page load to unload | Yes | Includes inactive time |
| `is_first_visit` | Whether this is user's first visit | Checked from cookie existence | Yes | Boolean flag |
| `session_number` | Number of sessions for this user | Incremented per session | Yes | Lifetime session count |
| `page_view_number` | Page view number in current session | Incremented per page view | Yes | Session-scoped counter |
| `is_bounce` | Whether session was a bounce | Single page view with < 10 sec engagement | No | Calculated on session end |

**Implementation Notes:** Engagement time should only count periods when the page is in focus (not when the user has switched tabs). This can be tracked using the Page Visibility API. Scroll depth should be tracked at 25%, 50%, 75%, and 100% milestones.

### 3.6 E-commerce Data

For e-commerce sites, detailed product and transaction data is essential for measuring revenue and optimizing product performance.

#### Product Data (for all e-commerce events)

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `item_id` | Product SKU or ID | Product data layer | Yes | Unique product identifier |
| `item_name` | Product name | Product data layer | Yes | e.g., Men's Running Shoes |
| `item_brand` | Product brand | Product data layer | No | e.g., Nike |
| `item_category` | Product category | Product data layer | No | e.g., Shoes |
| `item_category2` | Product subcategory | Product data layer | No | e.g., Running |
| `item_category3` | Product sub-subcategory | Product data layer | No | e.g., Men's |
| `item_variant` | Product variant | Product data layer | No | e.g., Size 10, Color Blue |
| `price` | Product price | Product data layer | Yes | Unit price in currency |
| `quantity` | Product quantity | Product data layer | Yes | Number of units |
| `currency` | Currency code | Product data layer | Yes | ISO 4217 code (e.g., USD) |
| `item_list_name` | List name where item was viewed | Product data layer | No | e.g., Search Results, Related Products |
| `item_list_id` | List ID where item was viewed | Product data layer | No | Unique list identifier |
| `index` | Item position in list | Product data layer | No | 0-indexed position |

#### Transaction Data (for purchase events)

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `transaction_id` | Unique order ID | Order confirmation page | Yes | Must be unique per transaction |
| `value` | Total transaction value | Order confirmation page | Yes | Total revenue including tax and shipping |
| `tax` | Total tax amount | Order confirmation page | No | Tax in currency |
| `shipping` | Shipping cost | Order confirmation page | No | Shipping in currency |
| `currency` | Currency code | Order confirmation page | Yes | ISO 4217 code (e.g., USD) |
| `coupon` | Coupon code used | Order confirmation page | No | e.g., SUMMER20 |
| `payment_method` | Payment method used | Order confirmation page | No | e.g., credit_card, paypal |
| `shipping_tier` | Shipping method | Order confirmation page | No | e.g., standard, express |
| `items` | Array of purchased products | Order confirmation page | Yes | Array of product objects with item data |

**Implementation Notes:** E-commerce data should be collected from a data layer (e.g., `window.dataLayer` for Google Tag Manager compatibility) or directly from the page DOM. The `transaction_id` must be unique and should be used for deduplication to prevent double-counting of purchases.

### 3.7 Lead Generation Data

For lead generation sites, form submission data is critical.

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `form_id` | Unique form identifier | Form element ID or name | Yes | e.g., contact_form, newsletter_signup |
| `form_name` | Human-readable form name | Form data attribute | No | e.g., Contact Us Form |
| `form_destination` | URL where form submits | Form action attribute | No | e.g., /submit-contact |
| `lead_type` | Type of lead | Form data attribute | No | e.g., contact, quote_request, demo |
| `lead_value` | Estimated lead value | Configured per form | No | Monetary value in currency |

**Implementation Notes:** Form submissions should be tracked by listening for the `submit` event on forms. The tracking should fire before the form is actually submitted to ensure the event is captured even if the user navigates away.

### 3.8 Event Metadata

Every event should include metadata for processing and routing.

| Data Point | Description | Source | Required | Notes |
|------------|-------------|--------|----------|-------|
| `event_name` | Name of the event | Defined per event type | Yes | e.g., page_view, purchase, add_to_cart |
| `event_timestamp` | Unix timestamp of event (ms) | JavaScript `Date.now()` | Yes | Client-side timestamp |
| `server_timestamp` | Unix timestamp when server received event | Server time | Yes | Server-side timestamp |
| `event_id` | Unique event identifier | Generated UUID v4 | Yes | For deduplication |
| `site_id` | Unique identifier for the website | Configured in script | Yes | Links event to client site |
| `script_version` | Version of tracking script | Hardcoded in script | Yes | For debugging and compatibility |

**Implementation Notes:** The `event_id` should be a UUID v4 generated on the client side. This allows for deduplication if the same event is sent multiple times due to network issues or retries.

---

## 4. IP Enrichment & Company Identification

### 4.1 Service Selection

After evaluating multiple IP enrichment services, **IPinfo.io** is recommended as the primary provider for the following reasons:

**Cost Effectiveness.** IPinfo.io offers a generous free tier of 50,000 requests per month, which is sufficient for initial development and testing. Paid plans start at $249/month for 250,000 requests, scaling to $499/month for 500,000 requests. This pricing is significantly more affordable than competitors like Clearbit while still providing high-quality data.

**Comprehensive Data.** IPinfo.io provides not just basic geolocation (city, region, country, coordinates) but also company identification for business IPs, ASN data, connection type classification, and privacy detection (VPN, proxy, Tor). This comprehensive dataset enables both geographic segmentation and B2B lead identification.

**Performance.** IPinfo.io delivers response times under 30ms for most queries, which is critical for maintaining low latency in the event processing pipeline. The service also has high uptime and reliability.

**Privacy Detection.** The built-in privacy detection flags help filter out VPN and proxy traffic, which cannot be reliably attributed to a specific company or location. This improves data quality by identifying and excluding unreliable traffic.

### 4.2 Data Enrichment Flow

The IP enrichment process follows this flow:

**Step 1: IP Capture.** When an event is received by the Warp tracking server, the user's IP address is extracted from the HTTP request headers. The server checks the `X-Forwarded-For` header first (in case the request is proxied) and falls back to the direct connection IP.

**Step 2: Cache Lookup.** Before making an API call, the system checks Redis for a cached result using the key `ip_enrichment:{ip_address}`. If a cached result exists and has not expired, it is returned immediately. This dramatically reduces API costs and improves response times.

**Step 3: API Enrichment.** If the IP is not in the cache, the system makes an API call to IPinfo.io with the IP address. The API returns a JSON object containing all available data for that IP, including location, organization, ASN, company (for business IPs), and privacy flags.

**Step 4: Visitor Classification.** The enriched data is analyzed to classify the visitor into one of four categories: Business (identifiable company), Consumer (residential ISP), Bot/Server (hosting provider), or Privacy User (VPN/proxy). This classification is added to the enriched data object.

**Step 5: Caching.** The enriched data, including the classification, is stored in Redis with a TTL (time to live) based on the visitor type. Business IPs are cached for 7 days (since company data rarely changes), consumer IPs for 24 hours (due to dynamic IP assignment), and VPN/proxy IPs for 6 hours (as users may switch servers).

**Step 6: Event Enhancement.** The enriched IP data is merged with the original event data, creating a complete event object that includes both the user's actions and their location/company context. This enhanced event is then stored in the database and routed to destination platforms.

### 4.3 Visitor Classification Logic

The visitor classification system uses the following rules:

**Business Visitor (High Priority).** A visitor is classified as a business visitor if the IPinfo.io response includes a `company` object with a `name` and `domain`, and the privacy flags indicate the IP is not a VPN, proxy, or hosting provider. Business visitors represent high-value leads for B2B companies and should be prioritized in the dashboard.

**Consumer Visitor (Standard Priority).** A visitor is classified as a consumer if the organization name matches a known ISP (Comcast, AT&T, Verizon, Charter, Cox, Spectrum, etc.) and the connection type is residential. Consumer visitors are typical e-commerce customers and should be tracked for conversion optimization.

**Bot/Server (Exclude).** A visitor is classified as a bot or server if the privacy flags indicate the IP is a hosting provider, or if the ASN type is "hosting". This includes traffic from AWS, Azure, Google Cloud, and other cloud providers. Bot traffic should be excluded from most analytics and reports.

**Privacy User (Low Priority).** A visitor is classified as a privacy user if the privacy flags indicate the IP is a VPN, proxy, or Tor exit node. These visitors cannot be reliably identified or located, so they should be deprioritized in B2B lead generation but still tracked for overall traffic metrics.

### 4.4 Caching Strategy

The caching strategy is designed to minimize API costs while maintaining data freshness:

**Cache Storage.** Redis is used for caching due to its high performance (sub-millisecond lookups) and built-in TTL support. Each cached IP is stored with the key `ip_enrichment:{ip_address}` and a value containing the full enriched data as a JSON string.

**Cache TTL by Visitor Type.** Different visitor types have different cache durations. Business IPs are cached for 7 days because company ownership of IP blocks rarely changes. Consumer IPs are cached for 24 hours because ISPs frequently reassign dynamic IPs. VPN/proxy IPs are cached for 6 hours because users may switch VPN servers. Unknown IPs are cached for 3 days as a middle ground.

**Cache Warming.** For high-traffic sites, the system can implement cache warming by pre-fetching enrichment data for common IP ranges during off-peak hours. This ensures that cache hits remain high even during traffic spikes.

**Cache Invalidation.** The system supports manual cache invalidation via an admin API endpoint, allowing operators to clear cached data for specific IPs if incorrect information is detected.

### 4.5 Cost Analysis

For an agency managing 50 client sites with an average of 10,000 unique visitors per site per month, the total is 500,000 unique IPs per month. Assuming a 30% cache hit rate (repeat visitors), this results in 350,000 API calls per month.

The IPinfo.io Standard plan at $499/month includes 500,000 requests, which comfortably accommodates this volume. If the agency charges clients $35/month for the IP enrichment feature, the total monthly revenue is $1,750, resulting in a profit of $1,251/month or $15,012/year. This represents a 251% ROI.

### 4.6 Privacy & Compliance

**GDPR Compliance.** Under GDPR, IP addresses are considered personal data. The solution addresses this through several measures: obtaining user consent via a cookie consent banner, documenting legitimate interest for processing (improving service quality and fraud prevention), implementing data minimization (only collecting necessary data), and enforcing retention limits (deleting IP data after 90 days).

**CCPA Compliance.** Under CCPA, the solution must disclose IP collection in the privacy policy, provide an opt-out mechanism (Do Not Sell My Personal Information), and ensure that IP data is not sold to third parties (it is only used for internal analytics and sent to platforms the client has authorized).

**Data Security.** All IP data is encrypted in transit using TLS 1.3 and at rest using database encryption. Access to IP data is restricted to authorized personnel only, and all access is logged for audit purposes.

---

## 5. Centralized Dashboard

### 5.1 Architecture Overview

The centralized dashboard is a web-based application that provides real-time visibility into tracking performance across all client sites. The architecture follows a modern, scalable design with a clear separation between the backend API and the frontend user interface.

**Backend.** The backend is built on **Node.js with Express** or **PHP with Laravel**, depending on the team's expertise. Node.js is recommended for its performance with real-time data and its rich ecosystem of packages. The backend exposes a RESTful API for data queries and a WebSocket endpoint for real-time event streaming.

**Database.** The primary database is **PostgreSQL**, which stores events, site configurations, user accounts, and company data. PostgreSQL is chosen for its reliability, ACID compliance, and excellent support for JSON data types (useful for storing flexible event payloads). **Redis** is used for caching frequently accessed data, storing session information, and managing job queues. For high-volume analytics queries, **ClickHouse** can be optionally added as a columnar database optimized for time-series data and aggregations.

**Frontend.** The frontend is a single-page application (SPA) built with **React** or **Vue.js**. React is recommended for its large ecosystem, strong community support, and excellent performance with complex UIs. The UI uses **Tailwind CSS** for styling and **shadcn/ui** or **Ant Design** for pre-built components. Charts and visualizations are powered by **Chart.js** or **Recharts**, and maps use **Leaflet** or **Mapbox**.

**Real-Time Communication.** The dashboard uses **Socket.io** or native **WebSockets** for real-time updates. When a new event is processed, the backend pushes it to connected dashboard clients, allowing users to see events as they happen without refreshing the page.

### 5.2 Dashboard Features

The dashboard is organized into six main sections:

**Overview Dashboard.** The overview provides a global view of all client sites and system health. It displays key metrics such as total events tracked today, total sessions, active sites, and API uptime. A line chart shows events over time for the last 24 hours. A table lists the top 10 performing sites by event volume. A world map visualizes visitor geographic distribution with heatmap intensity. A live activity feed shows recent events across all sites in real-time.

**Site Management.** The site management interface allows administrators to add, configure, and manage all client sites. A searchable table lists all sites with their domain, script ID, status, and event count. Clicking "Add New Site" opens a form to create a new site and generate its unique tracking script. Each site has a configuration page where administrators can enable/disable specific events, configure destination platform credentials (GA4, Meta, Google Ads), set up custom parameters, and manage cross-domain tracking settings.

**Site Analytics.** The site analytics view provides detailed analytics for an individual client site. It includes an overview with key metrics (events, sessions, page views, conversions, bounce rate, average session duration), a real-time event stream showing events as they happen, traffic source analysis with a pie chart and detailed table, top pages ranked by views, a geographic map showing visitor locations, device and browser breakdown, e-commerce metrics (if applicable), and a company visitors section for B2B sites showing identified companies with engagement scores.

**Data Flow Monitoring.** The data flow monitoring dashboard provides visibility into the health and performance of the tracking pipeline. It displays event pipeline status (events received per minute, events processed, events queued, events failed, average processing time), destination delivery status for each platform (events sent, success rate, failed events, average delivery time), a recent error log with error type, affected site, timestamp, and retry status, API performance metrics (request rate, average response time, P95/P99 latency, error rate, uptime), IP enrichment statistics (API calls made, cache hit rate, average lookup time, failed lookups, quota usage), and system resource utilization (CPU, memory, disk, network I/O, queue depth).

**Company Insights.** The company insights dashboard is focused on B2B lead generation. It features a company directory listing all identified companies with their name, domain, industry, location, first seen date, last seen date, total visits, and total page views. Clicking on a company opens a detailed view with the full company profile, visit history timeline, pages viewed, events triggered, engagement score, and contact information (if available). The dashboard also includes lead qualification with hot, warm, and cold lead categories based on engagement scores, and an industry analysis showing the breakdown of visitors by industry.

**Reports.** The reports section allows users to generate and schedule automated reports. Report types include executive summaries (high-level metrics, trends, top performers), site performance reports (detailed analytics, event breakdown, conversion funnel), company visitor reports (list of business visitors, engagement metrics, lead scoring), and data quality reports (event delivery success rate, error summary, missing data analysis). Reports can be scheduled to run daily, weekly, or monthly, and can be delivered via email or Slack/Teams notifications in PDF or CSV format.

### 5.3 Multi-Tenancy & Access Control

The dashboard is designed to support multiple agencies and clients with secure, isolated access:

**User Roles.** The system defines four user roles with different permission levels. Super Admins have full system access and can manage all agencies and clients. Agency Admins can manage their agency account, add/remove sites, manage agency users, and view all agency sites. Agency Managers can view assigned sites, edit site configuration, and generate reports, but cannot access billing. Client Users can view only their site(s) with read-only access and can download reports but cannot make configuration changes.

**Data Isolation.** Each agency's data is isolated in the database using an `agency_id` foreign key. Users can only query data for sites belonging to their agency. API endpoints enforce this isolation by filtering queries based on the authenticated user's agency. Super admins have a special flag that allows them to bypass this filtering for system administration purposes.

**Authentication & Authorization.** The dashboard uses JWT (JSON Web Tokens) for API authentication. When a user logs in, the server issues a JWT containing the user's ID, role, and agency ID. This token is included in the Authorization header of all API requests. The server validates the token and checks the user's role before processing the request. For third-party integrations, the system supports OAuth 2.0 for secure authorization without sharing passwords.

### 5.4 Performance Optimization

To ensure the dashboard remains fast and responsive even with large volumes of data, several optimization techniques are employed:

**Frontend Optimization.** The frontend uses code splitting to lazy load routes, reducing the initial bundle size. Charts and visualizations are dynamically imported only when needed. A service worker provides offline support and caches API responses using a stale-while-revalidate strategy. Large lists and tables use virtual scrolling or pagination to avoid rendering thousands of DOM elements at once.

**Backend Optimization.** The database uses indexes on frequently queried columns (site_id, timestamp, event_type) and composite indexes for common query patterns. Materialized views pre-compute expensive aggregations for faster reporting. Database connection pooling reduces the overhead of establishing new connections. Frequently accessed data (like site configurations and user profiles) is cached in Redis with a TTL of 5-10 minutes.

**Query Optimization.** Dashboard metrics are cached in Redis for 30-60 seconds, meaning multiple users viewing the same dashboard will see cached data rather than triggering redundant database queries. For historical data that doesn't change, longer cache durations (1 hour or more) can be used. The cache is invalidated when new events are processed to ensure real-time data remains accurate.

---

## 6. Implementation Roadmap

### Phase 1: MVP Development (Weeks 1-4)

The first phase focuses on building the core tracking functionality and a minimal viable dashboard.

**Week 1: Infrastructure Setup.** Set up the server environment on Warp, including Node.js, PostgreSQL, and Redis. Configure the development, staging, and production environments. Set up version control with Git and establish a CI/CD pipeline for automated testing and deployment.

**Week 2: Tracking Script Development.** Develop the client-side JavaScript tracking script that captures page views, clicks, and form submissions. Implement the event queuing and batching logic to minimize network requests. Create the server-side API endpoint to receive events from the script. Implement basic event validation and storage in PostgreSQL.

**Week 3: IP Enrichment Integration.** Integrate the IPinfo.io API for IP enrichment. Implement the caching layer in Redis with TTL-based expiration. Develop the visitor classification logic to categorize visitors as business, consumer, bot, or privacy user. Test the enrichment pipeline with sample IPs to verify accuracy.

**Week 4: Basic Dashboard.** Build the dashboard authentication system with user login and JWT tokens. Create the site management interface to add and configure client sites. Implement the script generation feature that creates unique tracking snippets for each site. Build a simple real-time event stream view to see events as they are received.

**Deliverables:** A functional tracking script that can be deployed on client websites, a server-side pipeline that receives and enriches events, a basic dashboard for managing sites and viewing real-time events.

### Phase 2: Dashboard & Analytics Expansion (Weeks 5-8)

The second phase expands the dashboard with advanced analytics and reporting capabilities.

**Week 5: Site Analytics Dashboard.** Build the site analytics view with key metrics (events, sessions, page views, conversions). Implement the traffic sources analysis with pie charts and detailed tables. Create the top pages report showing the most viewed pages. Add device and browser breakdown visualizations.

**Week 6: Company Insights & B2B Features.** Develop the company directory that lists all identified business visitors. Build the company detail view with visit history, pages viewed, and engagement score. Implement the lead scoring algorithm based on visit frequency, pages per visit, time on site, and conversion events. Create the industry analysis report showing visitor breakdown by industry.

**Week 7: Data Flow Monitoring.** Build the data flow monitoring dashboard showing event pipeline status. Implement the destination delivery monitoring for GA4, Meta, and Google Ads. Create the error log view with filtering and search capabilities. Add API performance metrics and IP enrichment statistics.

**Week 8: Automated Reporting.** Develop the report generation system with templates for executive summaries, site performance, and company visitors. Implement the report scheduling feature with daily, weekly, and monthly options. Set up email delivery for scheduled reports. Create the export functionality for PDF and CSV formats.

**Deliverables:** A comprehensive dashboard with site analytics, company insights, data flow monitoring, and automated reporting. Users can view detailed analytics for each site, identify high-value business visitors, monitor system health, and schedule automated reports.

### Phase 3: Beta Testing & Refinement (Weeks 9-12)

The third phase involves testing the solution with real clients and iterating based on feedback.

**Week 9: Beta Client Onboarding.** Select 3-5 beta clients with diverse use cases (e-commerce, lead generation, B2B). Onboard each client by deploying the tracking script on their website and configuring their dashboard access. Provide training on how to use the dashboard and interpret the data.

**Week 10: Monitoring & Support.** Monitor system performance and data accuracy for all beta clients. Track key metrics like event delivery success rate, API response times, and cache hit rates. Provide responsive support to beta clients for any issues or questions. Document common issues and create troubleshooting guides.

**Week 11: Feedback Collection & Iteration.** Conduct feedback sessions with beta clients to understand their experience. Identify pain points, missing features, and usability issues. Prioritize feedback based on impact and feasibility. Implement high-priority improvements and bug fixes.

**Week 12: Performance Optimization & Documentation.** Optimize database queries and caching strategies based on real-world usage patterns. Conduct load testing to ensure the system can handle the expected production traffic. Write comprehensive documentation for end users, including setup guides, feature explanations, and troubleshooting tips. Prepare marketing materials and case studies from beta clients.

**Deliverables:** A battle-tested solution that has been validated with real clients. Comprehensive documentation and marketing materials. A prioritized roadmap for post-launch features based on user feedback.

### Phase 4: Public Launch & Scaling (Weeks 13+)

The fourth phase focuses on launching the solution to the public and scaling the infrastructure to handle growth.

**Week 13: Launch Preparation.** Finalize pricing and packaging for different tiers. Set up billing and subscription management (using Stripe or similar). Create the public website with product information, pricing, and sign-up flow. Prepare launch announcements for email, social media, and industry publications.

**Week 14: Public Launch.** Officially launch the product to the public. Monitor system performance closely during the launch period. Provide responsive support to new customers. Track key metrics like sign-ups, activation rate, and customer satisfaction.

**Week 15+: Scaling & Continuous Improvement.** Scale the server infrastructure to handle increased traffic, potentially using load balancers and horizontal scaling. Continuously monitor system performance and optimize bottlenecks. Implement new features based on customer feedback and market trends. Build integrations with additional destination platforms (LinkedIn, Pinterest, Snapchat, etc.). Develop advanced features like predictive analytics, anomaly detection, and AI-powered insights.

**Deliverables:** A publicly available product with a growing customer base. A scalable infrastructure that can handle increasing traffic. A roadmap for continuous improvement and feature development.

---

## 7. Conclusion & Next Steps

This technical specification provides a comprehensive blueprint for building a script-based, server-side tracking solution on Warp. By collecting data on the server rather than relying on browser-based pixels, the solution bypasses privacy restrictions and restores up to 76% of hidden user behavior. The IP-to-company enrichment enables B2B lead identification, providing a competitive advantage for agencies serving business clients. The centralized dashboard offers real-time visibility into tracking performance across all client sites, making it easy to monitor data quality and identify high-value visitors.

The solution is designed to be scalable, compliant with privacy regulations, and easy to deploy on any website using a simple JavaScript snippet. The recommended implementation roadmap spans 12 weeks to MVP and beta testing, with a public launch in week 13.

### Immediate Next Steps

To move forward with this project, the following immediate actions are recommended:

1. **Sign up for IPinfo.io free trial** to test the IP enrichment API and verify data quality with sample IPs from your target markets.

2. **Set up the development environment** on Warp, including Node.js, PostgreSQL, and Redis, and configure version control with Git.

3. **Build a proof of concept** tracking script and server endpoint to validate the core data collection flow.

4. **Design dashboard mockups** to visualize the user interface and gather early feedback from potential users.

5. **Identify 3-5 beta clients** who are willing to test the solution on their websites and provide feedback during the development process.

By following this specification and roadmap, you will be well-positioned to build a competitive, high-value tracking solution that addresses the critical challenges facing digital marketers today.

---

## Appendix A: Complete Data Points Summary

This appendix provides a consolidated list of all data points to be collected, organized by category.

### User Identification
- `client_id`, `user_id`, `session_id`
- `email` (hashed), `phone` (hashed), `first_name` (hashed), `last_name` (hashed), `address` (hashed)

### Device & Browser
- `user_agent`, `device_category`, `browser`, `browser_version`, `operating_system`
- `screen_resolution`, `viewport_size`, `device_pixel_ratio`, `language`, `timezone`

### Network & Location
- `ip_address`, `ip_city`, `ip_region`, `ip_country`, `ip_postal_code`
- `ip_latitude`, `ip_longitude`, `ip_timezone`
- `ip_organization`, `ip_asn`, `ip_asn_name`, `ip_asn_domain`
- `ip_company_name`, `ip_company_domain`, `ip_connection_type`
- `ip_is_vpn`, `ip_is_proxy`, `ip_is_tor`, `ip_is_hosting`
- `visitor_type` (business, consumer, bot, privacy_user)

### Page & Referral
- `page_url`, `page_path`, `page_title`, `page_hostname`
- `page_referrer`, `referrer_hostname`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- `gclid`, `fbclid`, `ttclid`

### Engagement & Behavior
- `engagement_time_msec`, `scroll_depth_percent`, `scroll_depth_pixels`
- `time_on_page_sec`, `is_first_visit`, `session_number`, `page_view_number`, `is_bounce`

### E-commerce (Product Data)
- `item_id`, `item_name`, `item_brand`, `item_category`, `item_category2`, `item_category3`
- `item_variant`, `price`, `quantity`, `currency`
- `item_list_name`, `item_list_id`, `index`

### E-commerce (Transaction Data)
- `transaction_id`, `value`, `tax`, `shipping`, `currency`
- `coupon`, `payment_method`, `shipping_tier`, `items` (array)

### Lead Generation
- `form_id`, `form_name`, `form_destination`, `lead_type`, `lead_value`

### Event Metadata
- `event_name`, `event_timestamp`, `server_timestamp`
- `event_id`, `site_id`, `script_version`

---

## Appendix B: Recommended Event Types

This appendix lists the recommended event types to track, organized by priority.

### Priority 1: Essential Events (Implement First)

1. **page_view** - User views a page
2. **session_start** - New session begins
3. **user_engagement** - User actively engages with page (10+ seconds)
4. **click** - User clicks on a link or button
5. **scroll** - User scrolls to 25%, 50%, 75%, or 100% of page

### Priority 2: E-commerce Events (For E-commerce Sites)

6. **view_item** - User views a product detail page
7. **add_to_cart** - User adds item to shopping cart
8. **begin_checkout** - User begins checkout process
9. **add_payment_info** - User adds payment information
10. **purchase** - User completes a purchase

### Priority 3: Lead Generation Events (For Lead Gen Sites)

11. **generate_lead** - User submits a lead form
12. **form_start** - User begins filling out a form
13. **form_submit** - User submits any form
14. **file_download** - User downloads a file (PDF, whitepaper, etc.)
15. **video_start** - User starts playing a video

### Priority 4: Advanced E-commerce Events

16. **view_item_list** - User views a list of products
17. **select_item** - User clicks on a product in a list
18. **view_cart** - User views their shopping cart
19. **remove_from_cart** - User removes item from cart
20. **add_to_wishlist** - User adds item to wishlist
21. **refund** - Transaction is refunded

### Priority 5: Engagement Events

22. **search** - User performs a search
23. **select_promotion** - User clicks on a promotional banner
24. **view_promotion** - User views a promotional banner
25. **share** - User shares content on social media
26. **sign_up** - User creates an account
27. **login** - User logs into their account

---

## Appendix C: Technology Stack Summary

### Backend
- **Language/Framework:** Node.js with Express or PHP with Laravel
- **Primary Database:** PostgreSQL 15+
- **Cache & Queue:** Redis 7+
- **Analytics Database (Optional):** ClickHouse
- **Message Queue:** Redis Queue (Bull/BullMQ) or RabbitMQ

### Frontend
- **Framework:** React 18+ or Vue.js 3+
- **UI Library:** Tailwind CSS + shadcn/ui or Ant Design
- **Charts:** Chart.js or Recharts
- **Maps:** Leaflet or Mapbox
- **Real-time:** Socket.io or native WebSockets

### External Services
- **IP Enrichment:** IPinfo.io (Standard plan, $499/mo)
- **Destination Platforms:** GA4, Meta Conversions API, Google Ads API, TikTok Events API

### Infrastructure
- **Hosting:** Warp (or AWS, Google Cloud, Azure)
- **CDN:** Cloudflare or AWS CloudFront (for script delivery)
- **Monitoring:** Sentry (error tracking), Datadog or Grafana (metrics)
- **Authentication:** JWT (JSON Web Tokens)
- **Payments:** Stripe (for subscription billing)

---

**End of Technical Specification**
