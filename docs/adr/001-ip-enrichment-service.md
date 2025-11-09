# ADR 001: IP Enrichment Service Selection

**Status:** Accepted  
**Date:** 2025-11-07  
**Deciders:** Development Team  
**Technical Story:** IP enrichment and company identification for B2B tracking

---

## Context and Problem Statement

Beacon requires IP enrichment to provide:
1. **Geolocation data** (city, region, country, coordinates)
2. **Company identification** for B2B visitor tracking
3. **Privacy detection** (VPN, proxy, Tor detection)
4. **ASN and organization** information

We need to select an IP enrichment service that balances **accuracy**, **cost**, **performance**, and **features**.

---

## Decision Drivers

- **Cost effectiveness**: Need to support 500K+ requests/month at reasonable pricing
- **Company identification accuracy**: Critical for B2B use case
- **Response time**: Must be < 100ms to maintain API performance
- **Privacy detection**: Need to filter out VPN/proxy traffic
- **Free tier availability**: For development and testing
- **Data quality**: Accurate geolocation and organization data
- **API reliability**: High uptime and good documentation

---

## Options Considered

### Option 1: Clearbit Reveal API

**Pros:**
- Most comprehensive company data (employee count, revenue, tech stack)
- High accuracy for B2B identification
- Rich firmographic data
- Well-documented API

**Cons:**
- Most expensive ($99-$999+/month)
- Overkill for basic geolocation needs
- May have strict rate limits
- No free tier for testing

**Cost Analysis:**
- Entry plan: $99/month (limited requests)
- Growth plan: $499+/month
- Enterprise: Custom pricing

### Option 2: IPinfo.io ⭐ SELECTED

**Pros:**
- Excellent balance of features and cost
- Generous free tier (50,000 requests/month)
- Fast response times (< 30ms)
- Company identification for business IPs
- Privacy detection (VPN, proxy, Tor, hosting)
- ASN data included
- Good geolocation accuracy
- High uptime and reliability

**Cons:**
- Less detailed firmographic data than Clearbit
- Company data limited to name and domain (no employee count, revenue)

**Cost Analysis:**
- Free tier: 50,000 requests/month
- Basic: $249/month - 250,000 requests
- Standard: $499/month - 500,000 requests
- Business: $999/month - 1,000,000 requests

### Option 3: MaxMind GeoIP2

**Pros:**
- Downloadable database option (no per-query costs)
- Very fast lookups with local database
- Predictable annual pricing
- No rate limits with local database

**Cons:**
- Less detailed company data
- Organization names less accurate
- Database requires monthly updates
- Additional cost for ISP database

**Cost Analysis:**
- GeoIP2 Precision API: $0.0005 per query
- GeoIP2 Database: $180-$540/year
- ISP Database: $540/year

### Option 4: IP2Location

**Pros:**
- Affordable pricing
- Usage type detection (commercial, residential)
- Good coverage

**Cons:**
- Lower accuracy than IPinfo or Clearbit
- Smaller database
- Slower updates
- Limited free tier (500 queries/day)

**Cost Analysis:**
- Free: 500 queries/day
- Starter: $49/month - 30,000 queries
- Plus: $99/month - 100,000 queries
- Premium: $199/month - 300,000 queries

---

## Decision Outcome

**Chosen option: IPinfo.io** (Option 2)

### Rationale

1. **Best Cost-Performance Ratio**: $499/month for 500K requests is significantly cheaper than Clearbit while providing 90% of needed functionality

2. **Sufficient Company Data**: Provides company name and domain, which is enough for B2B lead identification. We don't need detailed firmographic data for initial MVP.

3. **Free Tier for Development**: 50K free requests allows full development and testing without cost

4. **Privacy Detection**: Built-in VPN/proxy/Tor detection helps filter unreliable traffic and improve data quality

5. **Performance**: < 30ms response time allows us to enrich IPs in real-time without blocking the event pipeline

6. **Easy Integration**: Simple REST API with good documentation

7. **Caching Strategy**: With smart caching (7d for business, 24h for consumer), we can reduce API costs by 70-80%

### Cost Projection

For an agency managing 50 client sites with 10,000 unique visitors per site per month:
- Total unique IPs: 500,000/month
- With 30% cache hit rate: 350,000 API calls
- IPinfo Standard plan: $499/month (includes 500K requests)
- Monthly cost per client: $499 / 50 = ~$10/client
- If charging clients $35/month for IP enrichment: $1,750 revenue
- **Profit: $1,251/month or 251% ROI**

### Fallback Strategy

If IPinfo.io becomes unavailable or too expensive, we can fall back to:
1. **MaxMind GeoIP2 Database**: Download local database for basic geolocation
2. **Basic geolocation only**: Continue tracking without company identification
3. **Alternative provider**: Switch to IP2Location or similar service

---

## Consequences

### Positive

- **Cost-effective solution** that scales with usage
- **Fast integration** with simple REST API
- **Smart caching** significantly reduces ongoing costs
- **Privacy detection** improves data quality
- **Free development** environment

### Negative

- **Limited firmographic data**: No employee count, revenue, or tech stack
- **API dependency**: Requires internet connectivity and external service uptime
- **Quota management**: Need to monitor usage to avoid overage charges

### Neutral

- **Caching required**: Must implement Redis caching to keep costs down
- **Monitoring needed**: Track cache hit rate and API usage

---

## Implementation Notes

### Caching Strategy

```javascript
// Cache TTL by visitor type
const CACHE_TTL = {
  business: 7 * 24 * 60 * 60,    // 7 days (IP ownership rarely changes)
  consumer: 24 * 60 * 60,         // 24 hours (dynamic IPs)
  vpn: 6 * 60 * 60,               // 6 hours (users switch VPN servers)
  unknown: 3 * 24 * 60 * 60,      // 3 days (middle ground)
};
```

### Visitor Classification Logic

1. **Business**: `company.name` and `company.domain` present + not VPN/proxy
2. **Consumer**: ISP organization (Comcast, AT&T, etc.)
3. **Bot**: Hosting provider (`privacy.hosting = true`)
4. **Privacy User**: VPN, proxy, or Tor detected

### Error Handling

- **API failures**: Return default enrichment data, continue tracking
- **Rate limit exceeded**: Log error, cache longer, alert team
- **Invalid IP**: Skip enrichment, proceed with event storage

---

## Related Decisions

- [ADR 002](./002-database-selection.md) - PostgreSQL for primary database
- [ADR 003](./003-caching-strategy.md) - Redis for caching (to be created)

---

## References

- [IPinfo.io Documentation](https://ipinfo.io/developers)
- [IPinfo.io Pricing](https://ipinfo.io/pricing)
- [Warp Tracking Solution Specification](../../Documentation/warp_tracking_solution_specification.md) - Section 4: IP Enrichment
- [IP Enrichment Design Doc](../../Documentation/IP%20Enrichment%20&%20Company%20Identification%20System%20Design.md)

---

**Last Reviewed:** 2025-11-07  
**Next Review:** 2026-02-07 (3 months)
