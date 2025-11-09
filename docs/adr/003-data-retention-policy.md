# ADR 003: Data Retention Policy

## Status
Accepted

## Context
Beacon stores large volumes of event data. Without a retention policy, the database will grow indefinitely, causing:
- Increased storage costs
- Slower query performance
- Compliance risks (GDPR, CCPA require data minimization)
- Backup/restore complexity

Typical analytics use cases require:
- Recent data (last 3-6 months) for operational analytics
- Historical trends (12+ months) for year-over-year comparisons
- Long-term aggregate data for trend analysis

## Decision
We will implement a **tiered data retention strategy** with automatic archival and deletion:

### Retention Periods

#### Raw Events (events table)
- **Default**: 13 months (1 year + 1 month buffer)
- **Configurable**: Agencies can choose 6, 13, or 25 months
- **After retention**: DELETE permanently

**Rationale**: 13 months allows full year-over-year comparisons while keeping database size manageable.

#### Sessions (sessions table)
- **Retention**: Same as events (13 months default)
- **After retention**: DELETE permanently

#### Aggregated Data (future: daily_summaries, monthly_reports)
- **Retention**: INDEFINITE
- **Storage**: Compressed, summarized data
- **Purpose**: Long-term trend analysis without raw data

#### Companies (companies table)
- **Retention**: INDEFINITE
- **Update**: Last_seen timestamp updated on new events
- **Cleanup**: Manual purge of companies with no activity in 24+ months

#### Sites & Agencies
- **Retention**: INDEFINITE (soft delete with status='deleted')
- **Hard delete**: Only on explicit admin action

### Implementation Strategy

#### Phase 1: Table Partitioning (PostgreSQL 10+)
```sql
-- Partition events table by month
CREATE TABLE events (
  -- columns
) PARTITION BY RANGE (server_timestamp);

-- Create monthly partitions
CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE events_2025_02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- etc.
```

#### Phase 2: Automated Cleanup Job
```javascript
// Cron job (daily at 2 AM)
const retentionMonths = agency.config.retentionMonths || 13;
const cutoffDate = new Date();
cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

// Drop old partitions (instant)
DROP TABLE IF EXISTS events_2023_10;

// Or DELETE if not using partitioning
DELETE FROM events 
WHERE server_timestamp < $cutoffDate
  AND site_id IN (SELECT script_id FROM sites WHERE agency_id = $agencyId);
```

#### Phase 3: Pre-Aggregation
```sql
-- Daily aggregation before deletion
INSERT INTO daily_summaries
SELECT
  site_id,
  DATE(server_timestamp) as date,
  COUNT(*) as events,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT client_id) as visitors,
  -- ... other metrics
FROM events
WHERE server_timestamp >= $cutoffDate - INTERVAL '1 day'
  AND server_timestamp < $cutoffDate
GROUP BY site_id, DATE(server_timestamp);
```

### Agency Configuration
Agencies can configure retention in their config JSONB:
```json
{
  "retention": {
    "events_months": 13,
    "archive_before_delete": false,
    "custom_rules": []
  }
}
```

### Compliance Features

#### GDPR Right to Erasure
```javascript
// Delete all data for a specific user
DELETE FROM events WHERE client_id = $clientId OR email_hash = $emailHash;
DELETE FROM sessions WHERE client_id = $clientId;
```

#### Data Export (GDPR Right to Access)
```javascript
// Export all user data
SELECT * FROM events WHERE client_id = $clientId ORDER BY server_timestamp;
```

## Consequences

### Positive
- **Cost savings**: Reduced storage costs (potentially 50-70% reduction)
- **Better performance**: Smaller tables = faster queries
- **Compliance**: Meets GDPR/CCPA data minimization requirements
- **Scalability**: Database size remains bounded
- **Flexibility**: Agencies can choose retention period

### Negative
- **Data loss**: Old raw data is permanently deleted
- **Limited historical analysis**: Can't query raw events beyond retention period
- **Complexity**: Requires partition management and cleanup jobs
- **Migration**: Existing data must be partitioned (one-time effort)

### Mitigation Strategies
- **Pre-aggregation**: Create daily/monthly summaries before deletion
- **Archive option**: Optional export to S3/cold storage before deletion
- **Clear warnings**: UI warnings when viewing data near retention boundary
- **Audit logs**: Log all deletion operations

## Alternatives Considered

### Alternative 1: Infinite Retention
**Rejected**: Unsustainable for high-volume sites. A site with 1M events/day would accumulate 365M events/year (hundreds of GB).

### Alternative 2: Shorter Retention (6 months)
**Rejected**: Too short for year-over-year analysis, which is a common analytics requirement.

### Alternative 3: Archive to Cold Storage (S3 Glacier)
**Future consideration**: For enterprise clients, optionally archive old partitions to S3 before deletion. Adds complexity and cost.

### Alternative 4: Time-Series Database (TimescaleDB, ClickHouse)
**Future consideration**: Purpose-built time-series DBs have built-in retention policies. Could migrate for scale.

## Implementation Phases

### Phase 1: Manual Cleanup (MVP)
- Admin script to delete old data
- Run manually as needed

### Phase 2: Automated Cleanup (v0.2)
- Cron job for daily cleanup
- Agency-configurable retention

### Phase 3: Partitioning (v0.3)
- Migrate to partitioned tables
- Instant partition drops

### Phase 4: Aggregation & Archival (v0.4)
- Pre-aggregate to daily_summaries
- Optional S3 archival

## Monitoring

### Metrics to Track
- Database size growth rate
- Oldest event timestamp per site
- Deletion job success/failure
- Query performance trends

### Alerts
- Database size exceeds threshold
- Deletion job fails
- Partition creation fails

## References
- GDPR Article 5: Data minimization principle
- PostgreSQL Partitioning: https://www.postgresql.org/docs/current/ddl-partitioning.html
- Google Analytics: 14-month retention (26 months for GA360)
- Mixpanel: 5-year retention (configurable)

## Related ADRs
- ADR 001: IP Enrichment Service Selection
- ADR 002: Session Management Strategy
- ADR 004: Authentication Approach (coming)

---

**Date**: 2025-11-08  
**Author**: Beacon Development Team  
**Reviewers**: Architecture Team, Legal/Compliance