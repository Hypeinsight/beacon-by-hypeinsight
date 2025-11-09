# Beacon Tracking Script - Installation Guide

**Version:** 1.0.0  
**Last Updated:** November 7, 2025

## Overview

The Beacon tracking script is a lightweight JavaScript snippet that collects user behavior data from your website and sends it to your Beacon server for analysis. This guide will walk you through the installation process.

---

## Quick Start

### Step 1: Get Your Site ID

Contact your Beacon administrator or log into your dashboard to get your unique Site ID.

### Step 2: Add the Script to Your Website

Add this code to the `<head>` section of your website, just before the closing `</head>` tag:

```html
<script>
  (function(w,d,s,o,f,js,fjs){
    w['BeaconObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','beacon','https://YOUR-DOMAIN.com/beacon.js'));
  
  beacon('init', 'YOUR_SITE_ID');
</script>
```

**Replace:**
- `https://YOUR-DOMAIN.com/beacon.js` with your Beacon server URL
- `YOUR_SITE_ID` with your actual Site ID

### Step 3: Verify Installation

Open your website in a browser and check:
1. **Browser Console** - Look for "Beacon initialized" message
2. **Network Tab** - Look for requests to your Beacon server
3. **LocalStorage** - Look for `_beacon_client_id` and `_beacon_session_id`

---

## What Gets Tracked Automatically

Once installed, Beacon automatically tracks:

✅ **Page Views** - Every page load  
✅ **Button Clicks** - All `<button>` and `<a>` clicks  
✅ **Form Submissions** - All form submits  
✅ **Scroll Depth** - 25%, 50%, 75%, 100% milestones  
✅ **User Engagement** - Time on page, activity time  
✅ **Session Management** - Unique client ID and session ID  
✅ **UTM Parameters** - Marketing campaign tracking  
✅ **Device Data** - Screen size, browser, OS, timezone  
✅ **Page Data** - URL, title, referrer

---

## Installation by Platform

### WordPress

Add to your theme's `header.php` file before `</head>`:

```php
<?php if (!is_admin()) : ?>
<script>
  (function(w,d,s,o,f,js,fjs){
    w['BeaconObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','beacon','https://YOUR-DOMAIN.com/beacon.js'));
  beacon('init', 'YOUR_SITE_ID');
</script>
<?php endif; ?>
```

### Shopify

1. Go to **Online Store > Themes**
2. Click **Actions > Edit code**
3. Open `theme.liquid`
4. Add the script before `</head>`
5. Save

### React/Next.js

Add to your `_app.js` or `_document.js`:

```jsx
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,o,f,js,fjs){
                w['BeaconObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
                js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
                js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
              }(window,document,'script','beacon','https://YOUR-DOMAIN.com/beacon.js'));
              beacon('init', 'YOUR_SITE_ID');
            `,
          }}
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
```

### Google Tag Manager

1. Create a new **Custom HTML Tag**
2. Paste the Beacon script
3. Set trigger to **All Pages**
4. Publish

---

## Custom Event Tracking

Track custom events anywhere in your code:

```javascript
// Simple event
beacon('track', 'button_click');

// Event with properties
beacon('track', 'purchase_completed', {
  transaction_id: 'order-123',
  value: 99.99,
  currency: 'USD'
});

// Track with e-commerce data
beacon('track', 'purchase', {
  properties: {
    page_url: window.location.href,
    utm_source: 'facebook'
  },
  ecommerce: {
    transaction_id: 'order-123',
    value: 99.99,
    currency: 'USD',
    items: [
      {
        item_id: 'SKU123',
        item_name: 'Product Name',
        price: 99.99,
        quantity: 1
      }
    ]
  }
});
```

---

## Configuration Options

### Custom Endpoint

If your Beacon server is on a custom URL:

```html
<script>
  window.beaconConfig = {
    endpoint: 'https://custom-domain.com/api/track',
    batchEndpoint: 'https://custom-domain.com/api/track/batch'
  };
</script>
<!-- Then add the regular Beacon script -->
```

---

## Testing

### Test Page

Open `tests/beacon-script.test.html` in your browser to test all tracking features:
- Page view tracking
- Click tracking
- Form submission tracking
- Scroll depth tracking
- Custom events

### Browser Console

Check for these messages:
```
Beacon initialized: { siteId: '...', clientId: '...', sessionId: '...' }
```

### Network Tab

Look for POST requests to:
- `/api/track/event` - Single events
- `/api/track/batch` - Batched events

### LocalStorage

Check for these keys:
- `_beacon_client_id` - Persistent user ID (2 year expiry)
- `_beacon_session_id` - Session ID (30 min inactivity timeout)
- `_beacon_session_time` - Last activity timestamp
- `_beacon_session_number` - Lifetime session count

### SessionStorage

Check for UTM parameters:
- `_beacon_utm_source`
- `_beacon_utm_medium`
- `_beacon_utm_campaign`
- `_beacon_utm_term`
- `_beacon_utm_content`
- `_beacon_gclid`, `_beacon_fbclid`, `_beacon_ttclid`

---

## Troubleshooting

### Script Not Loading

**Problem:** Beacon script not found  
**Solution:** Check that the script URL is correct and accessible

**Problem:** CORS errors  
**Solution:** Ensure your Beacon server has CORS enabled for your domain

### Events Not Being Tracked

**Problem:** No network requests appearing  
**Solution:** 
1. Check browser console for errors
2. Verify `beacon('init', 'SITE_ID')` is called
3. Check that Site ID is correct

**Problem:** Events queued but not sent  
**Solution:** Wait 5 seconds or trigger 10+ events (batch will auto-send)

### Session Issues

**Problem:** New session on every page  
**Solution:** Check that localStorage is enabled and not being cleared

**Problem:** Session not expiring  
**Solution:** Session expires after 30 minutes of inactivity (this is normal)

---

## Privacy & Compliance

### Data Collected

Beacon collects:
- ✅ Anonymous user IDs (no personal data)
- ✅ Page URLs and titles
- ✅ Device and browser information
- ✅ IP address (server-side only)
- ✅ Interaction data (clicks, scrolls)

### GDPR Compliance

To comply with GDPR:
1. Add cookie consent banner to your website
2. Only initialize Beacon after user consent:

```javascript
// Wait for consent
function handleCookieConsent(consented) {
  if (consented) {
    beacon('init', 'YOUR_SITE_ID');
  }
}
```

### Opt-Out

Provide an opt-out mechanism:

```javascript
// Disable tracking
localStorage.setItem('_beacon_opt_out', 'true');

// Check before tracking
if (!localStorage.getItem('_beacon_opt_out')) {
  beacon('init', 'YOUR_SITE_ID');
}
```

---

## Performance

### Script Size
- **beacon.js** (minified): ~3KB gzipped
- **beacon-dev.js** (with comments): ~12KB

### Impact
- ✅ **Async loading** - Does not block page rendering
- ✅ **Batch processing** - Reduces network requests
- ✅ **Passive event listeners** - Does not impact scrolling performance
- ✅ **localStorage** - Fast client-side storage

### Best Practices
1. Load script in `<head>` with `async` attribute
2. Use `sendBeacon` API for reliable delivery
3. Events are queued and batched automatically
4. No impact on Core Web Vitals

---

##Additional Features

### Cross-Domain Tracking

Track users across multiple domains:

```javascript
// On domain A
beacon('init', 'YOUR_SITE_ID');

// Link to domain B with client ID
const clientId = localStorage.getItem('_beacon_client_id');
window.location.href = 'https://domain-b.com?beacon_cid=' + clientId;

// On domain B
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('beacon_cid');
if (clientId) {
  localStorage.setItem('_beacon_client_id', clientId);
}
beacon('init', 'YOUR_SITE_ID');
```

---

## Support

**Need help?**
- 📧 Email: support@hypeinsight.com
- 📚 Documentation: [Full Docs](../README.md)
- 🐛 Report issues: GitHub Issues

---

## Changelog

### Version 1.0.0 (November 7, 2025)
- Initial release
- Page view tracking
- Click and form tracking
- Scroll depth tracking
- Session management
- UTM parameter persistence
- Event batching

---

**Happy Tracking!** 🚀
