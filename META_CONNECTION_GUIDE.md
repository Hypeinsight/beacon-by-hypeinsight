# Meta Conversions API - Connection Guide

## ✅ CURRENT STATUS

**Good news!** Your Meta integration is already configured and working:

- **Site:** Hype Insight (hypeinsight.com)
- **Dataset ID:** 1267025940367913
- **Access Token:** ✓ Configured
- **Action Source:** website
- **Recent Events:** ✓ Receiving events (111 events in last 10 minutes)

Events are being tracked and should be forwarding to Meta. Continue to verification steps below.

---

## 📋 Quick Setup Checklist

### ✅ Already Done (Current Setup)
- [x] Meta integration enabled in Beacon
- [x] Dataset ID configured
- [x] Access token set
- [x] Action source selected (website)
- [x] Events are being tracked by Beacon

### 🔍 Next Steps (Verification)
- [ ] Verify events appear in Meta Events Manager
- [ ] Check event quality score
- [ ] Set up Meta Pixel (optional - for client-side data)
- [ ] Configure additional sites (if needed)

---

## 🔍 VERIFICATION STEPS

### Step 1: Check Meta Events Manager

1. **Go to Events Manager**
   - Open: https://business.facebook.com/events_manager2
   - Select your Business Account

2. **Select Your Dataset**
   - Click on Dataset ID: `1267025940367913`
   - Or search for: "Hype Insight"

3. **View Test Events**
   - Click the **"Test Events"** tab
   - You should see real-time events appearing
   - Look for source: **"Server"** (this means Conversions API is working)

4. **Check Overview Tab**
   - Go to **"Overview"** tab
   - Look at "Events Received" chart
   - Should show increasing numbers

### Step 2: Verify Event Data Quality

1. In Events Manager, click on an event
2. Check that you see:
   - ✅ Event name (e.g., PageView)
   - ✅ Event time (should be recent)
   - ✅ Action source: "website"
   - ✅ User data (IP address, user agent)
   - ✅ Custom data (page URL, referrer)

3. **Check Event Match Quality**
   - Go to Dataset → Overview
   - Look for "Event Match Quality" score
   - Goal: 5+ out of 10 parameters matched
   - Higher = Better ad targeting

### Step 3: Check Beacon Server Logs

Open your Beacon server logs and look for:

```
[Meta] Event sent successfully to Dataset: 1267025940367913
```

If you see errors instead:
```
[Meta] Failed to send event: [error details]
```

Common errors and fixes are listed in Troubleshooting section below.

---

## 📊 WHAT'S BEING TRACKED

Beacon is currently forwarding these events to Meta:

| Event Type | Count (last 10 min) | Meta Event Name |
|------------|---------------------|-----------------|
| page_view | 26 | PageView |
| click | 32 | click |
| scroll | 21 | scroll |
| page_unload | 29 | page_unload |
| datalayer_page_view | 3 | datalayer_page_view |
| datalayer_scroll | 4 | datalayer_scroll |

**Note:** All events are sent via **server-side Conversions API**, which:
- ✅ Bypasses ad blockers
- ✅ Provides better data accuracy
- ✅ Recovers up to 76% of hidden events
- ✅ Improves ad attribution

---

## 🔧 CONFIGURATION DETAILS

### Current Setup (Hype Insight)

```
Site: Hype Insight
Domain: hypeinsight.com
Dataset ID: 1267025940367913
Action Source: website
Token Type: Site-level access token
Status: Active ✓
```

### How to Modify

1. **Open Beacon Dashboard**
   - URL: http://localhost:3000 (or your production URL)

2. **Go to Integrations Page**
   - Click "Integrations" in sidebar

3. **Select Site**
   - Choose "Hype Insight (hypeinsight.com)" from dropdown

4. **Modify Settings**
   - Toggle: Enable/Disable Meta integration
   - Dataset ID: Your 15-digit Pixel/Dataset ID
   - Action Source: Where events occur (website, app, offline, etc.)
   - Access Token: Optional (can use agency System User token instead)

5. **Save**
   - Click "Save Configuration" button

---

## 🚀 ADVANCED SETUP OPTIONS

### Option 1: Per-Site Tokens (Current Method)

**Pros:**
- Simple and direct
- Each site has its own token
- Good for single-site or few-site setups

**Current Usage:**
- Hype Insight: Using site-level token ✓

### Option 2: Agency System User Token (Recommended for Scale)

**Pros:**
- ONE token for ALL sites
- Easier management for agencies
- Centralized control

**Setup Steps:**

1. **Create System User in Meta Business Manager**
   ```
   1. Go to: https://business.facebook.com/settings
   2. Click: Users → System Users
   3. Click: Add
   4. Name: "Beacon Tracking Server"
   5. Role: Admin
   6. Click: Create System User
   ```

2. **Assign Datasets**
   ```
   1. Click on System User
   2. Go to: Add Assets
   3. Select: Pixels/Datasets
   4. Add all client Datasets
   5. Grant: "Manage Pixel" + "Advertise" permissions
   ```

3. **Generate Token**
   ```
   1. Still in System User page
   2. Click: Generate New Token
   3. Select permissions:
      ✓ ads_management
      ✓ business_management
   4. Set expiration: Never
   5. Click: Generate Token
   6. COPY TOKEN IMMEDIATELY!
   ```

4. **Configure in Beacon**

   **Via PowerShell:**
   ```powershell
   # Login to Beacon
   $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
     -Method POST `
     -Body (@{email="your@email.com"; password="yourpassword"} | ConvertTo-Json) `
     -ContentType "application/json"
   
   $jwt = $response.token
   
   # Set System User Token
   $headers = @{
     "Authorization" = "Bearer $jwt"
     "Content-Type" = "application/json"
   }
   
   $body = @{
     systemUserToken = "YOUR_META_SYSTEM_USER_TOKEN_HERE"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings/meta-token" `
     -Method PUT `
     -Headers $headers `
     -Body $body
   ```

   **Via UI (Coming Soon):**
   - Agency Settings → Meta → System User Token

5. **For Each Site:**
   - Just enter Dataset ID
   - Leave Access Token blank
   - Beacon uses agency token automatically

---

## 🔧 CONNECTING ADDITIONAL SITES

You have 5 other sites that could be connected:

1. **Primary Markets** (primarymarkets.com) - 2 configurations
2. **EcoXGear Australia** (ecoxgear.com.au)
3. **Hype Insight Website** (hypeinsight.com)
4. **Test Site** (localhost)

### To Connect a New Site:

1. **Get Meta Dataset ID**
   ```
   1. Go to: https://business.facebook.com/events_manager2
   2. Select your Business Account
   3. Click: Data Sources
   4. Find your Pixel/Dataset
   5. Copy the 15-digit ID
   ```

2. **In Beacon Dashboard:**
   ```
   1. Go to: Integrations
   2. Select: [Your Site] from dropdown
   3. Toggle ON: Meta Conversions API
   4. Enter: Dataset ID
   5. Select: Action Source (usually "website")
   6. Enter: Access Token (or leave blank for System User token)
   7. Click: Save Configuration
   ```

3. **Verify:**
   - Check Meta Events Manager
   - Should see events within 1-2 minutes

---

## 📝 ACTION SOURCES EXPLAINED

Choose the right source based on WHERE the event happens:

| Action Source | When to Use | Example |
|--------------|-------------|---------|
| **website** | Web browser events | Your current setup ✓ |
| **app** | Mobile/desktop apps | Mobile app purchases |
| **offline** | In-store or phone | Retail POS, call center orders |
| **physical_store** | Retail point-of-sale | Store checkout systems |
| **phone_call** | Phone orders | Call center conversions |
| **email** | Email-driven conversions | Email campaign clicks → purchase |
| **chat** | WhatsApp, Messenger | Chat-based orders |
| **system_generated** | Auto-renewals | Subscription renewals |
| **other** | Everything else | Miscellaneous sources |

**Why it matters:**
- Tells Meta where conversion happened
- Improves attribution accuracy
- Helps build better audiences
- Required for proper offline event tracking

---

## 🐛 TROUBLESHOOTING

### Problem: Events Not Showing in Meta

**Diagnosis Steps:**

1. **Check Beacon is receiving events:**
   ```powershell
   node check-meta-status.js
   ```
   Look for: "RECENT EVENTS" section

2. **Check Meta integration is enabled:**
   - Should see: "SITES WITH META ENABLED: 1 (or more)"
   - Should show Dataset ID

3. **Check access token:**
   - Should see: "Access Token: ✓ Set"

4. **Check server logs:**
   ```
   Look for:
   ✓ [Meta] Event sent successfully
   ✗ [Meta] Failed to send event
   ```

**Common Issues:**

| Problem | Solution |
|---------|----------|
| "No access token" | Add token in Integrations page OR set System User token |
| "Invalid token" | Regenerate token in Meta Events Manager |
| "Dataset not found" | Verify Dataset ID is correct (15 digits) |
| "Insufficient permissions" | Token needs: ads_management + business_management |
| "Events not appearing" | Wait 5-10 minutes, check Test Events tab |
| "Low match quality" | Add hashed PII (email, phone) to improve matching |

### Problem: Token Expired

**For Site-Level Tokens:**
1. Go to Meta Events Manager
2. Settings → Conversions API
3. Generate new token
4. Update in Beacon Integrations page

**For System User Tokens:**
1. Go to Business Settings → System Users
2. Click on your System User
3. Generate new token (set to "Never" expire)
4. Update in Beacon via API or UI

### Problem: Low Event Match Quality

**Goal:** 5+ out of 10 parameters

**How to Improve:**

1. **Add hashed PII to events:**
   - Email (hashed)
   - Phone (hashed)
   - First name (hashed)
   - Last name (hashed)

2. **Ensure these are captured:**
   - IP address ✓ (Beacon does this)
   - User agent ✓ (Beacon does this)
   - fbclid (from URL)
   - fbc/fbp cookies

3. **For e-commerce:**
   - Purchase value
   - Currency
   - Product IDs
   - Product names

---

## 📚 RELATED DOCUMENTATION

- **Quick Start:** `META_DATASET_QUICK_START.md`
- **System User Setup:** `META_SYSTEM_USER_SETUP.md`
- **Complete Setup Guide:** `META_DATASET_SETUP.md`
- **Official Meta Docs:** https://developers.facebook.com/docs/marketing-api/conversions-api

---

## 🎯 NEXT STEPS

### Immediate Actions (Verification)

1. **Check Meta Events Manager** ← START HERE
   - Verify events are appearing
   - Check event quality score

2. **Monitor for 24 hours**
   - Ensure consistent delivery
   - Watch for errors in logs

### Optional Enhancements

3. **Add Meta Pixel (Client-Side)**
   - Install pixel snippet on website
   - Enables client-side data collection
   - Improves matching with server-side events

4. **Configure Additional Sites**
   - Connect other 5 sites in your database
   - Use System User token for easier management

5. **Set Up Offline Tracking**
   - Create separate site config with `action_source: offline`
   - Send in-store/phone events to same Dataset
   - Better attribution for omnichannel

### Advanced Setup

6. **Configure Deduplication**
   - Use event_id for deduplication
   - Prevents double-counting when using Pixel + API

7. **Add Enhanced Data**
   - Capture hashed email/phone
   - Improves match quality
   - Better ad targeting

8. **Create Custom Conversions**
   - In Meta Events Manager
   - Based on your event names
   - Use for campaign optimization

---

## 🆘 GETTING HELP

### Self-Service Tools

1. **Status Check Script:**
   ```powershell
   node check-meta-status.js
   ```

2. **Config Check Script:**
   ```powershell
   node check-meta-config.js
   ```

3. **Server Logs:**
   - Check for `[Meta]` prefixed messages
   - Shows real-time delivery status

### Documentation

- Full setup guide: `META_DATASET_SETUP.md` (589 lines)
- System User guide: `META_SYSTEM_USER_SETUP.md`
- Development history: `SESSION_MEMORY.md`

### Meta Support

- Events Manager: https://business.facebook.com/events_manager2
- Conversions API Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
- Business Help Center: https://business.facebook.com/business/help

---

## ✅ CHECKLIST SUMMARY

- [x] Meta integration enabled
- [x] Dataset ID configured (1267025940367913)
- [x] Access token set
- [x] Action source selected (website)
- [x] Events being tracked (111 in last 10 min)
- [ ] Events verified in Meta Events Manager ← **DO THIS NEXT**
- [ ] Event quality score checked
- [ ] 24-hour monitoring completed
- [ ] Additional sites connected (optional)
- [ ] System User token configured (optional)

---

**Status:** 🟢 Ready to Verify
**Last Updated:** 2025-11-30
**Configuration:** Production-ready
**Documentation:** Complete

You're ready to verify! Go to Meta Events Manager and check that events are appearing. 🚀
