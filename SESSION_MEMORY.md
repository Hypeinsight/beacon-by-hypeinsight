# Beacon Development Session Memory
**Last Updated:** November 24, 2025

---

## What We've Accomplished

### ✅ Feature 1: AI-Powered Visitor Scoring (COMPLETE)
**Status:** Fully implemented and pushed to GitHub

**What it does:**
- Automatically assigns intelligent scores to events based on AI analysis
- High-value events (purchase: 25pts, signup: 20pts, form_submit: 15pts)
- Low-value events (page_view: 1pt, click: 3pts, scroll: 2pts)
- Negative scores for undesired events (unsubscribe: -5pts, error: -2pts)
- Auto-creates scoring rules when events are detected
- Users can customize AI-suggested scores

**Files created:**
- `migrations/add_visitor_scoring.sql` - Database tables
- `src/services/scoringService.js` - AI scoring engine
- `src/controllers/scoringController.js` - API handlers
- `src/routes/scoring.js` - API routes
- `frontend/src/pages/Scoring.jsx` - Configuration UI

**Database tables:**
- `event_scoring_rules` - Score values per event type
- `visitor_scores` - Cumulative scores per visitor
- `score_history` - Audit trail of score changes

---

### ✅ Feature 2: Selective GA4 Event Forwarding (COMPLETE)
**Status:** Fully implemented and pushed to GitHub

**What it does:**
- Pick specific events to forward to Google Analytics 4
- Checkbox UI showing all detected events with occurrence counts
- Select All / Deselect All buttons
- Replaces old "all events" or "page_view only" radio buttons

**Files modified:**
- `src/controllers/sitesController.js` - Added detected events endpoint
- `src/routes/sites.js` - Added route
- `frontend/src/pages/Integrations.jsx` - Enhanced with checkboxes

**API endpoint:**
- `GET /api/sites/:siteId/detected-events` - Returns list of events with counts

---

### ✅ Feature 3: Meta Ads Business Manager Integration (COMPLETE)
**Status:** Fully implemented and pushed to GitHub

**What it does:**
- Supports Meta Business Manager System User tokens
- ONE token can serve ALL client sites
- Each site only needs Pixel ID (not individual tokens)
- Automatic token fallback: site-level → agency-level → skip
- Perfect for agencies managing multiple brands

**Implementation:**
- Agency-level System User token stored in `agencies.config` JSONB
- Token priority logic in `metaService.js`
- Agency config fetched and passed through tracking pipeline
- Token masking in API responses for security

**Files created:**
- `src/controllers/agencySettingsController.js` - Token management
- `META_SYSTEM_USER_SETUP.md` - Complete setup guide

**Files modified:**
- `src/services/destinations/metaService.js` - Added System User support
- `src/services/destinations/destinationManager.js` - Pass agency config
- `src/services/trackingService.js` - Fetch agency config
- `src/routes/agencies.js` - Added settings endpoints

**API endpoints:**
- `GET /api/agencies/settings` - View token status (masked)
- `PUT /api/agencies/settings/meta-token` - Set System User token
- `DELETE /api/agencies/settings/meta-token` - Remove token

---

## Current Status

### Ready to Use:
1. ✅ **AI Visitor Scoring** - Automatic, intelligent scoring
2. ✅ **Selective GA4 Forwarding** - Choose which events to send
3. ✅ **Meta Ads (Backend)** - System User approach implemented

### Needs Configuration:
1. **Meta Ads** - Requires System User token from Business Manager
2. **Google Ads** - Requires OAuth setup (more complex)

### Not Started:
1. **Feature 3 (Original):** Live Event Creation with CSS selector
2. **Feature 4:** Content Personalization based on visitor source

---

## What Ari Needs to Do Next

### To Enable Meta Ads:

**Step 1: Create System User in Meta Business Manager**
1. Go to business.facebook.com → Business Settings
2. Users → System Users → Add
3. Name: "Beacon Tracking Server"
4. Role: Admin
5. Assign all client Pixels to this System User
6. Grant permissions: "Manage Pixel" and "Advertise"

**Step 2: Generate Access Token**
1. In System User page → Generate New Token
2. Permissions: `ads_management` + `business_management`
3. Expiration: Never
4. Copy token immediately

**Step 3: Configure in Beacon (via API)**
```powershell
# Get your JWT token by logging into Beacon first
$jwt = "YOUR_JWT_TOKEN"

# Set System User token
$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

$body = @{
    systemUserToken = "YOUR_META_SYSTEM_USER_TOKEN"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings/meta-token" -Method PUT -Headers $headers -Body $body
```

**Step 4: Configure Each Site**
1. Integrations page
2. Enable Meta toggle
3. Enter Pixel ID only (leave Access Token blank)
4. Save

**Step 5: Test**
- Generate events on tracked site
- Check Meta Events Manager → Test Events
- Look for "Server" source
- Check logs: `[Meta] Event sent successfully`

---

## Database Migrations Needed

**Before testing:**
```powershell
# Connect to PostgreSQL
psql -U your_username -d beacon

# Run scoring migration
\i migrations/add_visitor_scoring.sql
```

This creates:
- event_scoring_rules table
- visitor_scores table
- score_history table
- All necessary indexes

---

## Git Status

**All changes committed and pushed to:**
- Repository: https://github.com/Hypeinsight/beacon-by-hypeinsight.git
- Branch: main
- Latest commits:
  - `9ea35ea` - Meta Business Manager System User support
  - `dc9cabf` - AI-powered automatic event scoring
  - `6dbaf0c` - Visitor scoring and selective GA4 forwarding

---

## File Structure Reference

### Backend Services:
```
src/services/
├── scoringService.js          # AI scoring engine
├── trackingService.js         # Event tracking (modified)
└── destinations/
    ├── destinationManager.js  # Routes to GA4/Meta/Google Ads (modified)
    ├── ga4Service.js          # GA4 integration
    ├── metaService.js         # Meta integration (modified for System User)
    └── googleAdsService.js    # Google Ads integration

```

### Backend Controllers:
```
src/controllers/
├── scoringController.js           # Scoring API
├── sitesController.js             # Sites + detected events (modified)
└── agencySettingsController.js    # Agency token management

```

### Frontend Pages:
```
frontend/src/pages/
├── Scoring.jsx           # AI scoring configuration
├── Integrations.jsx      # Enhanced with event checkboxes (modified)
└── EventBuilder.jsx      # Custom events (existing)
```

### Documentation:
```
/
├── TESTING_GUIDE.md                 # Testing instructions
├── META_SYSTEM_USER_SETUP.md        # Meta setup guide
└── SESSION_MEMORY.md                # This file
```

---

## Next Steps (When You Return)

### Option 1: Test Current Features
1. Run database migration
2. Configure Meta System User token
3. Test visitor scoring
4. Test GA4 event selection
5. Test Meta event forwarding

### Option 2: Continue Development
**Remaining features from original request:**

**Feature 3: Live Event Builder**
- Create events directly on website using CSS selector
- Modal overlay for event creation
- Save directly without copying to dashboard
- Needs authenticated bookmarklet

**Feature 4: Content Personalization**
- Show/hide elements based on visitor source
- Rules based on UTM params, geo, visitor type
- New personalization_rules table
- Rule evaluation in tracking script
- Rule builder UI

### Option 3: Enhance Existing
- Add UI for agency Meta token management (currently API-only)
- Implement Google Ads OAuth flow
- Add selective event forwarding for Meta (like GA4)
- Add visitor scoring display to Visitors page

---

## Important Notes

### Security:
- System User tokens stored in `agencies.config` JSONB
- Tokens masked in API responses (show only last 4 chars)
- Never exposed client-side
- JWT required for all management endpoints

### Token Priority:
1. Site-level access token (if configured)
2. Agency-level System User token (if configured)
3. Skip (if neither configured)

### Logging:
Watch for these in server logs:
- `[AI Scoring] Auto-created rule for {event}: {score} points`
- `[Meta] Using agency-level System User token`
- `[Meta] Event sent successfully`
- `[GA4] Event sent successfully`

---

## Quick Commands

### Start Development:
```powershell
# Backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

### Check Git Status:
```bash
git status
git log --oneline -5
```

### Database Queries:
```sql
-- Check scoring rules
SELECT * FROM event_scoring_rules LIMIT 10;

-- Check visitor scores
SELECT * FROM visitor_scores ORDER BY total_score DESC LIMIT 10;

-- Check agency Meta token status
SELECT config->'meta'->'systemUserToken' FROM agencies WHERE id = 'YOUR_AGENCY_ID';
```

---

## Questions to Answer When You Return

1. Did you set up the Meta System User token?
2. Are events flowing to Meta successfully?
3. Do you want to proceed with Features 3 & 4?
4. Do you need a UI for agency settings instead of API?
5. Should we implement Google Ads OAuth next?

---

**End of Session Memory**
