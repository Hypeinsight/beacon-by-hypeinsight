# Testing Guide for New Features

## Features Implemented

### ✅ Feature 1: User Event Scoring System (COMPLETE)
Track individual visitor scores based on event activities.

### ✅ Feature 2: Selective Event Forwarding to GA4 (COMPLETE)
Pick and choose which events to forward to Google Analytics 4.

### 🔄 Feature 3: Live Event Creation (Partial - Backend Ready)
### 🔄 Feature 4: Content Personalization (Not Started)

---

## Prerequisites

### 1. Run Database Migration

The scoring feature requires new database tables. Run the migration:

```powershell
# Connect to your PostgreSQL database
psql -U your_username -d beacon

# Run the migration file
\i migrations/add_visitor_scoring.sql
```

Or using the migrate command if available:
```powershell
npm run migrate
```

### 2. Start the Services

```powershell
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

---

## Test Plan

### Feature 1: User Event Scoring

#### Backend API Tests

**1. Get Scoring Rules (Empty State)**
```powershell
# Get JWT token first by logging in
$token = "YOUR_JWT_TOKEN"
$headers = @{
    "Authorization" = "Bearer $token"
}

# Get site ID from dashboard
$siteId = "YOUR_SITE_ID"

# Get scoring rules
Invoke-RestMethod -Uri "http://localhost:3000/api/sites/$siteId/scoring-rules" -Headers $headers
```

**2. Create Scoring Rules**
```powershell
$body = @{
    rules = @(
        @{
            eventName = "page_view"
            scoreValue = 1
            description = "Basic page view"
            active = $true
        },
        @{
            eventName = "form_submit"
            scoreValue = 10
            description = "High-value form submission"
            active = $true
        },
        @{
            eventName = "button_click"
            scoreValue = 2
            description = "CTA button click"
            active = $true
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/sites/$siteId/scoring-rules" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

**3. Verify Scoring Rules Were Created**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sites/$siteId/scoring-rules" -Headers $headers
```

#### Frontend Dashboard Tests

**Test 1: Access Scoring Page**
1. Log in to dashboard at `http://localhost:5173`
2. Click "Scoring" in the left navigation
3. Verify the page loads with event list

**Test 2: Configure Scoring Rules**
1. Select a site from dropdown
2. Wait for detected events to load
3. For each event:
   - Check the checkbox to enable scoring
   - Enter a score value (e.g., page_view = 1, form_submit = 10)
   - Add optional description
4. Click "Save Scoring Rules"
5. Verify success message appears

**Test 3: Verify Scoring Updates After Events**
1. Generate some test events (visit your tracked site, click buttons, etc.)
2. Wait a few seconds for processing
3. Query visitor scores:
```powershell
$clientId = "YOUR_CLIENT_ID" # Get from events table or browser localStorage
Invoke-RestMethod -Uri "http://localhost:3000/api/sites/$siteId/visitors/$clientId/score" -Headers $headers
```

**Test 4: Check Score History**
The API response from Test 3 should include:
- `score.total_score`: Total accumulated points
- `score.score_breakdown`: JSON object showing event counts
- `history`: Array of score changes with timestamps

---

### Feature 2: Selective Event Forwarding to GA4

#### Frontend Tests

**Test 1: Access Integrations Page**
1. Log in to dashboard
2. Navigate to "Integrations" page
3. Verify the page loads

**Test 2: Configure GA4 Integration**
1. Select a site
2. Enable GA4 toggle
3. Enter Measurement ID (e.g., G-XXXXXXXXXX)
4. Enter API Secret
5. Verify "Event Forwarding" section shows checkbox list

**Test 3: Select Specific Events**
1. Wait for detected events to load
2. Use "Select All" button to select all events
3. Use "Deselect All" button to clear selection
4. Manually check specific events (e.g., page_view, form_submit)
5. Verify event counts are displayed next to each event name
6. Click "Save Configuration"
7. Verify success message

**Test 4: Verify Selected Events Are Forwarded**
1. Generate test events on your tracked website
2. Check GA4 Real-Time reports
3. Verify only selected events appear in GA4 (with 'beacon_' prefix)
4. Events NOT selected should not appear

#### Backend API Tests

**Check Detected Events**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sites/$siteId/detected-events" -Headers $headers
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "name": "page_view",
      "count": 150
    },
    {
      "name": "button_click",
      "count": 45
    }
  ]
}
```

---

## Database Verification

### Check Scoring Tables

```sql
-- View scoring rules
SELECT * FROM event_scoring_rules WHERE site_id = 'YOUR_SITE_ID';

-- View visitor scores
SELECT * FROM visitor_scores WHERE site_id = 'YOUR_SITE_ID' ORDER BY total_score DESC LIMIT 10;

-- View score history
SELECT sh.*, vs.client_id, vs.total_score
FROM score_history sh
JOIN visitor_scores vs ON sh.visitor_score_id = vs.id
WHERE vs.site_id = 'YOUR_SITE_ID'
ORDER BY sh.created_at DESC
LIMIT 20;

-- Top scored visitors view
SELECT * FROM top_scored_visitors WHERE site_id = 'YOUR_SITE_ID' LIMIT 10;
```

---

## Troubleshooting

### Scoring Not Working

**Check 1: Migration Ran Successfully**
```sql
-- Verify tables exist
\dt event_scoring_rules
\dt visitor_scores
\dt score_history
```

**Check 2: Scoring Rules Are Active**
```sql
SELECT event_name, score_value, active FROM event_scoring_rules WHERE site_id = 'YOUR_SITE_ID';
```

**Check 3: Events Are Being Tracked**
```sql
SELECT COUNT(*), event_name FROM events WHERE site_id = 'YOUR_SITE_ID' GROUP BY event_name;
```

**Check 4: Server Logs**
Check console for errors:
- "Error updating visitor score"
- "Error calculating event score"

### GA4 Events Not Forwarding

**Check 1: Integration Configuration**
```sql
SELECT config->'destinations'->'ga4' FROM sites WHERE id = 'YOUR_SITE_ID';
```

**Check 2: Event Selection**
Verify the `events` array in GA4 config contains your selected events (or ['*'] for all).

**Check 3: Server Logs**
Look for:
- "[GA4] Event check"
- "[GA4] Sending event to GA4"
- "[GA4] Event sent successfully"
- "[GA4] Delivery failed"

---

## Expected Behavior

### Scoring System
1. When an event occurs, scoring service checks for matching rules
2. If a rule exists and is active, the score is applied to visitor
3. Visitor's `total_score` increases
4. `score_breakdown` JSON shows count per event type
5. Entry is added to `score_history` table

### Event Forwarding
1. When an event is saved, destinationManager checks site config
2. If GA4 is enabled, checks if event is in selected events list
3. If `events: ['*']`, forwards all events
4. If `events: ['page_view', 'form_submit']`, only forwards those
5. Event is sent to GA4 Measurement Protocol with 'beacon_' prefix

---

## Performance Notes

- Scoring operations are async and non-blocking
- Failed scoring doesn't affect event tracking
- Batch events process scores efficiently with setImmediate
- Use indexes for fast lookups on high-volume sites

---

## Next Steps After Testing

If tests pass:
1. ✅ Feature 1 & 2 are production-ready
2. Can proceed with Feature 3 (Live Event Builder)
3. Then Feature 4 (Content Personalization)

If tests fail:
1. Check error logs
2. Verify database migration
3. Confirm API endpoints are registered
4. Check authentication tokens
