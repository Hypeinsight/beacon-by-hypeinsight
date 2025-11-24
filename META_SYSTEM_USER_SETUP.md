# Meta System User Setup Guide

## Overview

Beacon now supports **Meta Business Manager System User** tokens for agency-wide Meta Ads integration. This allows you to:

- ✅ Use ONE access token for ALL client sites
- ✅ Manage multiple Pixels from one Business Manager
- ✅ Easier token management (no need to configure per-site)
- ✅ Better for agencies managing multiple brands

---

## Setup Steps

### Step 1: Create System User in Meta Business Manager

1. Go to [Meta Business Settings](https://business.facebook.com/settings)
2. Click **Users → System Users** (in the left sidebar)
3. Click **Add** button
4. Name it: `Beacon Tracking Server` (or any descriptive name)
5. Set Role: **Admin** (required for Conversions API access)
6. Click **Create System User**

### Step 2: Assign Pixels to System User

1. Click on the newly created System User
2. Go to **Add Assets** tab
3. Select **Pixels**
4. Add all client Pixels you want Beacon to track
5. For each Pixel, grant: **Manage Pixel** and **Advertise** permissions
6. Click **Save Changes**

### Step 3: Generate Access Token

1. Still in the System User page, go to **Generate New Token**
2. Select your Ad Account
3. Check these permissions:
   - ✅ `ads_management`
   - ✅ `business_management`  
4. Set expiration: **Never** (recommended for server-to-server)
5. Click **Generate Token**
6. **IMPORTANT:** Copy the token immediately (you won't see it again!)

---

## Configuration in Beacon

### Option A: Agency-Level (Recommended for Multiple Sites)

**Use ONE System User token for ALL sites:**

1. Log into Beacon Dashboard
2. Go to **Agency Settings** (coming soon in UI)
3. Enter your System User Access Token
4. Save

Then for each site:
1. Go to **Integrations**
2. Enable Meta toggle
3. Enter **Pixel ID only** (leave Access Token blank)
4. Beacon will automatically use the agency System User token
5. Save

### Option B: Per-Site (For Single Sites or Mixed Management)

1. Go to **Integrations**
2. Enable Meta toggle
3. Enter both:
   - **Pixel ID**: Your client's unique Pixel
   - **Access Token**: Either System User token OR Pixel-specific token
4. Save

**Priority:** If both agency-level and site-level tokens exist, site-level takes precedence.

---

## API Usage

### Set Agency System User Token

```bash
PUT /api/agencies/settings/meta-token
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "systemUserToken": "YOUR_SYSTEM_USER_TOKEN_HERE"
}
```

### Get Agency Settings (Token Status)

```bash
GET /api/agencies/settings
Authorization: Bearer {jwt_token}
```

Response:
```json
{
  "success": true,
  "data": {
    "meta": {
      "systemUserToken": "****xyz9",  // Masked for security
      "hasToken": true
    }
  }
}
```

### Delete Agency Token

```bash
DELETE /api/agencies/settings/meta-token
Authorization: Bearer {jwt_token}
```

---

## How It Works

### Event Flow

```
1. Event occurs on client site
2. Beacon receives event
3. Beacon checks for Meta integration:
   
   Site Config Check:
   ├─ Site has access token? → Use site token
   └─ No site token?
      └─ Agency has System User token? → Use agency token
         └─ No tokens? → Skip Meta forwarding

4. Event sent to Meta Conversions API
   └─ Endpoint: graph.facebook.com/v18.0/{PIXEL_ID}/events
   └─ Header: Authorization: Bearer {TOKEN}
```

### Token Priority

1. **Site-level access token** (if configured)
2. **Agency-level System User token** (if configured)
3. **Skip** (if neither configured)

This allows flexibility:
- Most sites use agency token (easy management)
- Special sites can override with their own token
- Graceful fallback if misconfigured

---

## Benefits

### Before (Per-Site Tokens)
```
Site A → Token A → Pixel A
Site B → Token B → Pixel B  
Site C → Token C → Pixel C

❌ 3 tokens to manage
❌ 3 tokens to refresh
❌ More configuration work
```

### After (System User)
```
Agency → ONE System User Token
  ├─ Site A → Pixel A
  ├─ Site B → Pixel B
  └─ Site C → Pixel C

✅ 1 token to manage
✅ Centralized control
✅ Less configuration
```

---

## Troubleshooting

### Events Not Appearing in Meta

**Check 1: Token Permissions**
```
System User must have:
- ads_management
- business_management
```

**Check 2: Pixel Assignment**
```
System User must be assigned to the Pixel in Business Manager
```

**Check 3: Server Logs**
```
Look for:
[Meta] Using agency-level System User token
[Meta] Event sent successfully

OR

[Meta] Delivery failed: {error}
```

**Check 4: Verify Token in Database**
```sql
SELECT config->'meta'->'systemUserToken' FROM agencies WHERE id = 'YOUR_AGENCY_ID';
```

### Token Expired

System User tokens with "Never" expiration shouldn't expire, but if they do:

1. Generate new token in Business Manager
2. Update in Beacon:
   ```
   PUT /api/agencies/settings/meta-token
   { "systemUserToken": "NEW_TOKEN" }
   ```

---

## Security Notes

- ✅ Tokens are stored encrypted in database
- ✅ API responses mask tokens (show only last 4 chars)
- ✅ Tokens never exposed in client-side code
- ✅ Only agency admins can set/view tokens
- ⚠️ Keep System User tokens secure (they have broad access)
- ⚠️ Use "Never" expiration only for server-to-server use

---

## Testing

### Test the Integration

1. Configure System User token in Beacon
2. Enable Meta integration for a site (with Pixel ID only)
3. Generate test events on that site
4. Check Meta Events Manager → Test Events
5. Look for events with source: **Server**

### Expected Result

```
✅ Events appear in Meta Events Manager
✅ Source shows as "Server" 
✅ Event data includes user info, page data, etc.
✅ Server logs show: [Meta] Event sent successfully
```

---

## Next Steps

1. Set up your System User in Meta Business Manager
2. Generate the token
3. Configure in Beacon (via API or upcoming UI)
4. Add Pixel IDs to each site
5. Test with a few events
6. Monitor in Meta Events Manager

Need help? Check the server logs or contact support!
