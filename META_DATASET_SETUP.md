# Meta Dataset Integration Guide
**Using Conversions API with Datasets for Multi-Channel Tracking**

---

## Table of Contents
1. [What are Meta Datasets?](#what-are-meta-datasets)
2. [Dataset vs Pixel: Understanding the Difference](#dataset-vs-pixel-understanding-the-difference)
3. [Why Use Datasets?](#why-use-datasets)
4. [Setup Methods](#setup-methods)
5. [Step-by-Step Configuration](#step-by-step-configuration)
6. [Action Sources Explained](#action-sources-explained)
7. [System User Token Setup (Agency Mode)](#system-user-token-setup-agency-mode)
8. [Testing Your Integration](#testing-your-integration)
9. [Troubleshooting](#troubleshooting)

---

## What are Meta Datasets?

**Meta Datasets** are Meta's unified data containers that consolidate event data from multiple sources into a single view. Instead of managing separate tracking IDs for web (Pixel), mobile apps (SDK), and offline events, you can use one Dataset ID to track everything.

### Key Features:
- **Unified Tracking**: One ID for web, app, and offline events
- **Better Attribution**: Connect customer journeys across channels
- **Simplified Management**: One dashboard for all event sources
- **Conversions API Ready**: Designed for server-side tracking

---

## Dataset vs Pixel: Understanding the Difference

### Traditional Pixel Approach (Old)
```
Website → Meta Pixel (JavaScript) → Meta Servers
         ↓
   Pixel ID: 123456789
   Browser-side only
   Cookie-dependent
```

### Modern Dataset Approach (Current)
```
Website    → Conversions API → Dataset
Mobile App → App Events SDK  → Dataset (ID: 123456789)
Offline    → CRM/Server      → Dataset
           ↓
    Unified Customer Journey
```

### Important Notes:
- **Most Pixels were auto-converted to Datasets** by Meta
- In most cases: **Dataset ID = Your Old Pixel ID**
- You can still use the same ID for both Pixel and Conversions API
- The API endpoint is the same: `/{datasetId}/events`

---

## Why Use Datasets?

### 1. **Multi-Channel Attribution**
Track a customer's complete journey:
- Sees ad on Instagram → Visits website → Downloads app → Purchases in-store
- All events linked to one Dataset = Complete attribution

### 2. **Privacy Compliance**
- Server-side tracking reduces reliance on browser cookies
- Better data quality with iOS 14.5+ restrictions
- GDPR/CCPA compliant data handling

### 3. **Improved Event Match Quality**
- Send both browser data (fbp, fbc) AND server data (email, phone)
- Higher match rates = Better ad targeting
- Reduced cost per conversion

### 4. **Offline Events Support**
- Track phone orders, in-store purchases, bookings
- Attribute offline conversions to digital ads
- Build lookalike audiences from offline customers

---

## Setup Methods

Beacon supports **two configuration approaches** for Meta integration:

### Method 1: Site-Level Tokens (Simple)
- Each site has its own access token
- Good for: Single-client setups, testing
- Setup time: ~5 minutes per site

### Method 2: System User Token (Agency Mode) ⭐ Recommended
- ONE token for ALL client sites
- Perfect for agencies managing multiple brands
- Only need Dataset ID per site
- Setup time: ~10 minutes once, then 30 seconds per site

---

## Step-by-Step Configuration

### Prerequisites
- Meta Business Manager account
- Admin access to Business Manager
- At least one Dataset (or Pixel that was converted to Dataset)

---

## Option A: Quick Setup (Site-Level Token)

### Step 1: Find Your Dataset

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Click **Data Sources** in left menu
3. Find your Pixel/Dataset and click it
4. Copy the **Dataset ID** (15-digit number at the top)
   - If you see "Pixel ID", use that - it's your Dataset ID

### Step 2: Generate Access Token

1. In the same Dataset page, click **Settings** tab
2. Scroll to **Conversions API** section
3. Click **Generate Access Token**
4. Copy the token immediately (you won't see it again)

### Step 3: Configure in Beacon

1. Login to Beacon dashboard
2. Go to **Integrations** page
3. Select your site from dropdown
4. Enable **Meta Conversions API** toggle
5. Enter:
   - **Dataset ID**: The 15-digit ID from Step 1
   - **Action Source**: Choose based on your use case:
     - `Website` - For web tracking (most common)
     - `Offline` - For in-store/phone conversions
     - `App` - For mobile app events
   - **Access Token**: The token from Step 2
6. Click **Save Configuration**

### Step 4: Test

Visit your tracked website and trigger some events. Check:
- Beacon server logs: `[Meta] Event sent successfully`
- Meta Events Manager → Test Events tab
- Look for events with source: **Server**

---

## Option B: Agency Setup (System User Token) ⭐

This approach allows you to manage multiple client Datasets with ONE token.

### Step 1: Create System User

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click **Business Settings** (gear icon)
3. Navigate to **Users** → **System Users**
4. Click **Add** button
5. Configure:
   - **Name**: `Beacon Tracking Server`
   - **Role**: Admin
6. Click **Create System User**

### Step 2: Assign Datasets to System User

1. In the System User page, find **Assign Assets** section
2. Click **Add Assets**
3. Select **Datasets** (or **Pixels**)
4. Check all client Datasets you want to track
5. Toggle permissions:
   - ✅ **Manage Dataset** (or **Manage Pixel**)
   - ✅ **View Dataset Analytics**
6. Click **Save Changes**

**Important**: Repeat this for each new client Dataset.

### Step 3: Generate System User Token

1. Still in System User page, find **Generate New Token** button
2. Click it and configure:
   - **App**: Select your app (or create one if needed)
   - **Permissions**: Check these:
     - `ads_management`
     - `business_management`
   - **Token Expiration**: Select **Never**
3. Click **Generate Token**
4. **COPY THE TOKEN IMMEDIATELY** - you can't retrieve it later

### Step 4: Configure Agency Token in Beacon

You need to make an API call to store the System User token:

```powershell
# First, get your JWT token by logging in
$loginBody = @{
    email = "your-email@example.com"
    password = "your-password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$jwt = $response.token

# Now set the System User token
$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

$body = @{
    systemUserToken = "YOUR_META_SYSTEM_USER_TOKEN_HERE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings/meta-token" -Method PUT -Headers $headers -Body $body
```

**Expected response:**
```json
{
  "message": "Meta System User token updated successfully",
  "tokenStatus": "configured"
}
```

### Step 5: Configure Each Client Site

Now for each client site, you only need the Dataset ID:

1. Login to Beacon dashboard
2. Go to **Integrations** page
3. Select client site
4. Enable **Meta Conversions API** toggle
5. Enter:
   - **Dataset ID**: Client's Dataset/Pixel ID
   - **Action Source**: Choose appropriate source
   - **Access Token**: Leave blank (will use System User token)
6. Click **Save Configuration**

### Token Priority Logic

Beacon uses this priority when sending events:
1. ✅ Site-level Access Token (if provided)
2. ✅ Agency-level System User Token (if site token is blank)
3. ❌ Skip (if neither is configured)

This allows you to:
- Use System User token for most clients
- Override with site-specific token when needed

---

## Action Sources Explained

The `action_source` parameter tells Meta **where** the conversion event occurred. Choose the right one for accurate attribution.

### Available Options:

| Action Source | When to Use | Example Use Cases |
|--------------|-------------|-------------------|
| **website** | Online events from your website | Page views, form submissions, e-commerce purchases |
| **app** | Events from mobile/desktop apps | In-app purchases, app installs, feature usage |
| **offline** | Events that happen offline | In-store purchases, phone orders, trade show sign-ups |
| **email** | Email-driven conversions | Newsletter sign-ups, email link clicks |
| **chat** | Chat/messaging conversions | WhatsApp orders, Messenger bookings |
| **phone_call** | Phone-based conversions | Call center orders, support calls |
| **physical_store** | In-store specific | Point-of-sale transactions, retail purchases |
| **system_generated** | Automated/scheduled events | Subscription renewals, recurring payments |
| **other** | Anything else | Catch-all for unique sources |

### Best Practices:

1. **Be Consistent**: Use the same action_source for similar events
2. **Be Specific**: `physical_store` is better than generic `offline` for retail
3. **Match Reality**: Don't mark in-store sales as `website` - it confuses attribution

### Multi-Source Setup Example:

**Agency with multiple touchpoints:**
- **Site 1** (E-commerce): action_source = `website`
- **Site 2** (Mobile App): action_source = `app`
- **Site 3** (Phone Orders): action_source = `phone_call`
- **Site 4** (Retail Stores): action_source = `physical_store`

All can use the same System User token, but different action sources for proper attribution.

---

## System User Token Setup (Agency Mode)

### Why System User Tokens?

**Traditional Approach** (❌ Old Way):
```
Client A → Generate token → Configure in Beacon
Client B → Generate token → Configure in Beacon
Client C → Generate token → Configure in Beacon
...
Token expires → Regenerate all tokens → Reconfigure everything
```

**System User Approach** (✅ New Way):
```
Create System User → Generate ONE token (never expires)
↓
Assign Client A Dataset → Configure only Dataset ID
Assign Client B Dataset → Configure only Dataset ID
Assign Client C Dataset → Configure only Dataset ID
...
Done! No token management per client.
```

### Benefits:

1. **Scalability**: Add new clients in 30 seconds
2. **Reliability**: Tokens never expire (if set correctly)
3. **Security**: Token stored once at agency level
4. **Flexibility**: Override with site tokens when needed
5. **Simplicity**: No per-client token management

### Security Notes:

- System User tokens are **highly sensitive**
- They have access to ALL assigned Datasets
- Stored encrypted in `agencies.config` JSONB
- Never exposed in API responses (masked: `EAA...4567`)
- Never sent to client-side code
- Use HTTPS in production

### Verifying System User Token Status:

```powershell
# Check if token is configured (masked response)
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings" -Method GET -Headers $headers
```

Response:
```json
{
  "meta": {
    "systemUserToken": "EAA...4567",
    "tokenStatus": "configured"
  }
}
```

### Updating System User Token:

```powershell
# Use the same PUT endpoint with new token
Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings/meta-token" -Method PUT -Headers $headers -Body $newTokenBody
```

### Removing System User Token:

```powershell
# Delete the token (all sites revert to site-level tokens)
Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings/meta-token" -Method DELETE -Headers $headers
```

---

## Testing Your Integration

### Step 1: Check Server Logs

Start your Beacon server and watch for:

```
[Meta] Using agency-level System User token
[Meta] Event sent successfully to Dataset: 123456789012345
```

Or if using site-level token:
```
[Meta] Event sent successfully to Dataset: 123456789012345
```

### Step 2: Use Meta Test Events

1. Go to Meta Events Manager
2. Select your Dataset
3. Click **Test Events** tab
4. Look for your events with:
   - Source: **Server**
   - Event ID: Matches your Beacon event IDs
   - User data: Should show email/phone hashes

### Step 3: Validate Event Match Quality

1. In Meta Events Manager, click your Dataset
2. Go to **Overview** tab
3. Check **Event Match Quality** score
4. Aim for 6.0+ (out of 10)

**How to improve match quality:**
- Send more user data (email, phone, name)
- Include fbc parameter (from fbclid URL param)
- Use consistent event_id for deduplication
- Send events within 62 days of occurrence

### Step 4: Test Different Action Sources

If you're tracking multiple sources:

1. Create test events with different action_source values
2. In Meta Events Manager → Dataset → Overview
3. Click **By Data Source** filter
4. Verify events appear under correct source:
   - Website events under "Web"
   - Offline events under "Offline"
   - App events under "App"

---

## Troubleshooting

### Events Not Appearing in Meta

**Check #1: Dataset ID**
- Verify 15-digit ID is correct
- Check if it's actually a Dataset (not an Ad Account ID)
- Look in Meta Events Manager → Data Sources

**Check #2: Access Token**
- Token must have `ads_management` permission
- Check token hasn't expired
- Verify System User has access to Dataset

**Check #3: Server Logs**
- Look for `[Meta] Event sent successfully`
- Check for error messages
- Verify events are being tracked in Beacon first

**Check #4: Event Match Quality**
- Low match quality = events might not be usable
- Send more user identifiers (email, phone)
- Hash PII correctly (lowercase, trim, SHA256)

### System User Token Not Working

**Issue**: "Meta access token required" error

**Solution**: Verify token is configured
```powershell
# Check agency settings
Invoke-RestMethod -Uri "http://localhost:3000/api/agencies/settings" -Method GET -Headers $headers
```

**Issue**: "Invalid access token" error

**Solutions**:
1. Regenerate token in Meta Business Manager
2. Ensure permissions: `ads_management` + `business_management`
3. Check System User has access to the Dataset
4. Update token in Beacon via API

### Dataset Not Found

**Issue**: "Dataset ID 123456789 not found"

**Solutions**:
1. Check if ID is actually a Pixel ID (use it anyway)
2. Verify you have access to the Dataset in Business Manager
3. Assign Dataset to your System User if using agency mode
4. Check Dataset wasn't deleted or archived

### Wrong Action Source

**Issue**: Events appear under wrong source in Meta

**Solution**: Update action_source in Beacon:
1. Go to Integrations page
2. Select site
3. Change **Action Source** dropdown
4. Save configuration
5. New events will use correct source

### Token Expired

**Issue**: Events stopped flowing, "Invalid OAuth access token"

**Solutions**:
- **Site-level token**: Regenerate in Events Manager → Settings → Conversions API
- **System User token**: Check expiration in System User settings, regenerate if needed
- **Best practice**: Always set System User tokens to "Never expire"

---

## Frequently Asked Questions

### Q: Do I need both Pixel and Conversions API?

**A:** No, but it's recommended. Using both provides:
- **Redundancy**: If one fails, the other still tracks
- **Better matching**: Browser data + server data = higher match quality
- **Deduplication**: Meta uses `event_id` to avoid double-counting

### Q: Can I use the same Dataset ID for multiple websites?

**A:** Technically yes, but not recommended. Use separate Datasets per brand/domain for:
- Cleaner reporting
- Better audience segmentation
- Easier troubleshooting
- Separate ad account attribution

### Q: What's the difference between Conversions API and Offline Conversions API?

**A:** 
- **Offline Conversions API**: Deprecated, being removed May 2025
- **Conversions API**: Current standard, supports all event types (web, app, offline)
- Beacon uses the modern Conversions API with configurable `action_source`

### Q: How long does it take for events to appear in Meta?

**A:** Usually within 1-2 minutes. Test Events appear immediately. Production events may take up to 20 minutes during initial setup.

### Q: Can I send historical data?

**A:** Yes, but within limits:
- Events must be within **62 days** of conversion
- Must be within **90 days** of earliest attribution event (ad click/view)
- Enable "Allow historical uploads" in Dataset settings if needed

### Q: How do I handle GDPR/CCPA compliance?

**A:** Beacon automatically:
- Hashes all PII (email, phone, names) using SHA256
- Doesn't store raw PII
- Sends data over HTTPS
- You should: Add consent management, include data_processing_options if needed

---

## Additional Resources

### Meta Official Docs
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Dataset Overview](https://www.facebook.com/business/help/952192354843755)
- [System Users Guide](https://www.facebook.com/business/help/755714304604753)

### Beacon Documentation
- `TESTING_GUIDE.md` - Complete testing procedures
- `META_SYSTEM_USER_SETUP.md` - Quick System User reference
- `SESSION_MEMORY.md` - Development history and decisions

### Support
- Check server logs: `npm run dev` in Beacon directory
- Meta Events Manager: [business.facebook.com/events_manager2](https://business.facebook.com/events_manager2)
- Meta Business Help Center: [facebook.com/business/help](https://www.facebook.com/business/help)

---

## Quick Reference

### Configuration Checklist

**System User Setup (Once):**
- [ ] Create System User in Business Manager
- [ ] Assign all client Datasets to System User
- [ ] Generate never-expiring token with correct permissions
- [ ] Store token in Beacon via API
- [ ] Verify token is configured (GET /api/agencies/settings)

**Per-Site Setup (30 seconds):**
- [ ] Get client's Dataset ID from Events Manager
- [ ] Open Beacon → Integrations
- [ ] Select site
- [ ] Enable Meta Conversions API
- [ ] Enter Dataset ID
- [ ] Choose appropriate Action Source
- [ ] Leave Access Token blank (uses System User)
- [ ] Save configuration
- [ ] Test with Test Events in Meta

**Verification:**
- [ ] Events appear in Meta Test Events
- [ ] Source shows as "Server"
- [ ] Event Match Quality > 6.0
- [ ] Events attributed to correct ad campaigns

---

**Last Updated**: November 26, 2025  
**Beacon Version**: 1.0.0  
**Meta API Version**: v18.0
