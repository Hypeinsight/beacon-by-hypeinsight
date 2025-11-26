# Meta Dataset Integration - Quick Start

## What Changed?

We've updated Beacon to use **Meta Datasets** with the **Conversions API** approach, which is the correct and modern way to integrate with Meta (Facebook/Instagram) advertising.

---

## Key Updates

### 1. **UI Changes**
- ✅ "Pixel ID" → "Dataset ID" 
- ✅ New "Action Source" dropdown with 9 options
- ✅ Access Token is now optional (use System User token instead)
- ✅ Better help text explaining Dataset approach

### 2. **Backend Changes**
- ✅ Support for `action_source` parameter (website, app, offline, etc.)
- ✅ Backward compatibility with `pixelId` field
- ✅ Automatic fallback: datasetId → pixelId → error

### 3. **New Documentation**
- ✅ `META_DATASET_SETUP.md` - Comprehensive 589-line guide
- ✅ `SESSION_MEMORY.md` - Development history

---

## What is a Dataset?

**Old Way (Pixel):**
```
Website → Meta Pixel (JavaScript) → Meta Servers
```

**New Way (Dataset):**
```
Website    → Conversions API →
Mobile App → App Events SDK  → Dataset (One ID for everything)
Offline    → CRM/Server      →
```

### Important:
- **Most Pixels were auto-converted to Datasets by Meta**
- **In most cases: Dataset ID = Your Old Pixel ID**
- You can use the same ID you've always used
- The API endpoint is the same: `/{datasetId}/events`

---

## Quick Configuration

### Option 1: Using UI (Simplest)

1. Open Beacon dashboard
2. Go to **Integrations** page
3. Select your site
4. Enable **Meta Conversions API** toggle
5. Fill in:
   - **Dataset ID**: Your 15-digit Pixel/Dataset ID
   - **Action Source**: Select from dropdown
     - `Website` - For web tracking (most common)
     - `Offline` - For in-store/phone sales
     - `App` - For mobile apps
   - **Access Token**: (Optional - leave blank to use System User token)
6. Save

### Option 2: Using System User Token (Agency Mode)

**One-time setup:**
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{email="your@email.com";password="pass"}|ConvertTo-Json) -ContentType "application/json"
$jwt = $response.token

# Set System User token (get from Meta Business Manager)
$headers = @{"Authorization"="Bearer $jwt";"Content-Type"="application/json"}
$body = @{systemUserToken="YOUR_META_SYSTEM_USER_TOKEN"}|ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings/meta-token" -Method PUT -Headers $headers -Body $body
```

**Per-site setup (30 seconds):**
- Just enter Dataset ID and Action Source
- Leave Access Token blank
- System User token is used automatically

---

## Action Sources Explained

Choose the right one based on **where** the event happens:

| Source | Use When |
|--------|----------|
| `website` | Web browser events (most common) |
| `app` | Mobile/desktop app events |
| `offline` | In-store purchases, phone orders |
| `physical_store` | Retail point-of-sale |
| `phone_call` | Phone orders, call center |
| `email` | Email-driven conversions |
| `chat` | WhatsApp, Messenger orders |
| `system_generated` | Auto-renewals, subscriptions |
| `other` | Everything else |

**Why it matters:**
- Tells Meta where the conversion happened
- Improves attribution accuracy
- Helps build better audiences
- Required for proper offline event tracking

---

## Testing

### 1. Check Server Logs
```
[Meta] Using agency-level System User token
[Meta] Event sent successfully to Dataset: 123456789012345
```

### 2. Check Meta Events Manager
1. Go to [business.facebook.com/events_manager2](https://business.facebook.com/events_manager2)
2. Select your Dataset
3. Click **Test Events** tab
4. Look for events with source: **Server**

### 3. Verify Action Source
1. In Events Manager → Dataset → Overview
2. Filter **By Data Source**
3. Verify events appear under correct source (Web, App, Offline)

---

## What You Need from Meta

### For Simple Setup:
1. **Dataset ID** - Find in Events Manager → Data Sources
2. **Access Token** - Generate in Dataset → Settings → Conversions API

### For Agency Setup:
1. **System User** - Create in Business Settings → System Users
2. **Assign Datasets** - Add all client Datasets to System User
3. **System User Token** - Generate with `ads_management` + `business_management` permissions
4. Set to **Never expire**

---

## Backward Compatibility

✅ Existing configurations still work!

- If you have `pixelId` configured, it's treated as `datasetId`
- Old integrations will continue working
- No breaking changes

---

## Common Questions

### Q: Do I need to change my existing setup?
**A:** No, if it's working. But you should:
1. Change "Pixel ID" label to "Dataset ID" mentally
2. Consider adding `action_source` for better tracking
3. Consider System User token for easier management

### Q: Will my events stop working?
**A:** No. The API endpoint is the same, and we support both `pixelId` and `datasetId` fields.

### Q: Should I use action_source?
**A:** Yes! It helps Meta:
- Attribute conversions correctly
- Build better audience segments
- Optimize ad delivery
- Especially important for offline events

### Q: Can I track both web and offline?
**A:** Yes! Create different sites (or use the same Dataset ID) with different action_sources:
- Site 1: `action_source = website`
- Site 2: `action_source = offline`

---

## Documentation

- **`META_DATASET_SETUP.md`** - Complete guide (589 lines)
- **`SESSION_MEMORY.md`** - Development history
- **Meta Docs:** [developers.facebook.com/docs/marketing-api/conversions-api](https://developers.facebook.com/docs/marketing-api/conversions-api)

---

## Need Help?

1. **Check server logs**: Look for `[Meta]` prefixed messages
2. **Check Meta Events Manager**: Test Events tab shows real-time data
3. **Read full docs**: `META_DATASET_SETUP.md` has troubleshooting section
4. **Verify token**: `GET /api/agencies/settings` shows masked token status

---

**Changes committed:** `2b31dae`  
**Files changed:** 4 files, 960 insertions  
**Status:** ✅ All changes pushed to GitHub
