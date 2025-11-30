# Meta Integration - Quick Verification Guide

## 🎯 YOUR IMMEDIATE NEXT STEP

### ✅ Configuration is COMPLETE - Now Verify It Works

**Your Setup:**
- Site: Hype Insight (hypeinsight.com)
- Dataset ID: 1267025940367913
- Status: ✅ Active & receiving events

---

## 🔍 3-MINUTE VERIFICATION

### Step 1: Open Meta Events Manager (30 seconds)
1. Go to: https://business.facebook.com/events_manager2
2. Select your Business Account
3. Click on Dataset: **1267025940367913**

### Step 2: Check Test Events (1 minute)
1. Click **"Test Events"** tab at the top
2. Look for events appearing in real-time
3. Verify the source shows: **"Server"** ← This confirms Conversions API is working!

### Step 3: Check Overview (1 minute)
1. Click **"Overview"** tab
2. Look at "Events Received" graph
3. Should show activity in the last few hours

---

## ✅ SUCCESS INDICATORS

You should see:
- ✅ Events appearing in Test Events tab
- ✅ Source: "Server" (not "Browser")
- ✅ Event names: PageView, click, scroll, etc.
- ✅ User data: IP address, user agent
- ✅ Increasing numbers in Overview graph

---

## ❌ IF NOTHING SHOWS UP

### Option 1: Wait & Check Again
- Sometimes takes 5-10 minutes for first events
- Refresh the page after waiting

### Option 2: Quick Diagnosis
Run this command:
```powershell
node check-meta-status.js
```

Look for:
- ✓ "Meta enabled: 1 site"
- ✓ "Access Token: Set"
- ✓ "Recent events: X events"

### Option 3: Check Server Logs
Look for these messages:
```
✓ Good: [Meta] Event sent successfully to Dataset: 1267025940367913
✗ Bad:  [Meta] Failed to send event: [error]
```

---

## 📊 CURRENT STATS

**Last 10 minutes:**
- Events received by Beacon: 111
- Event types: 6 (page_view, click, scroll, etc.)
- Configuration: Complete ✓

**These events SHOULD be appearing in Meta now.**

---

## 🎯 WHAT TO DO AFTER VERIFICATION

### If Events ARE Showing (Success! 🎉)
1. Monitor for 24 hours
2. Check event quality score (aim for 5+/10)
3. Consider connecting other sites
4. Set up custom conversions in Meta

### If Events NOT Showing (Troubleshooting)
1. Check token hasn't expired
2. Verify Dataset ID is correct
3. Check server logs for errors
4. See full troubleshooting in: `META_CONNECTION_GUIDE.md`

---

## 🔗 HELPFUL LINKS

- **Meta Events Manager:** https://business.facebook.com/events_manager2
- **Your Dataset ID:** 1267025940367913
- **Full Guide:** `META_CONNECTION_GUIDE.md`
- **Troubleshooting:** `META_CONNECTION_GUIDE.md` (Troubleshooting section)

---

## 💡 QUICK TIPS

### Event Names in Meta
| Beacon Event | Meta Event |
|--------------|------------|
| page_view | PageView |
| click | click |
| scroll | scroll |
| purchase | Purchase |

### What's Being Sent
Every event includes:
- Event name & timestamp
- User IP & user agent
- Page URL & referrer
- Action source: "website"
- Custom event properties

---

## ⚡ ONE-MINUTE CHECKLIST

- [ ] Open Meta Events Manager
- [ ] Navigate to Dataset: 1267025940367913
- [ ] Check Test Events tab
- [ ] Confirm events are appearing with "Server" source
- [ ] Done! ✅

---

**Time to verify:** ~3 minutes  
**Expected result:** Events showing in Meta Events Manager  
**If issues:** See `META_CONNECTION_GUIDE.md` for full troubleshooting

**START HERE:** https://business.facebook.com/events_manager2 🚀
