# Deploying Beacon to Render

This guide walks you through deploying the Beacon analytics platform to Render.

## Prerequisites

- A GitHub account with access to the repository
- A Render account (sign up at https://render.com)

## Deployment Steps

### Option 1: Deploy Using render.yaml (Recommended)

1. **Connect your GitHub repository to Render**
   - Go to https://render.com/dashboard
   - Click "New +" → "Blueprint"
   - Select "Connect a repository"
   - Authorize Render to access your GitHub account
   - Select the `beacon-by-hypeinsight` repository

2. **Render will automatically detect `render.yaml`**
   - Review the services that will be created:
     - `beacon-api` - Backend Node.js web service
     - `beacon-dashboard` - Frontend static site
     - `beacon-db` - PostgreSQL database
     - `beacon-redis` - Redis instance

3. **Click "Apply"**
   - Render will create all services and configure them automatically
   - The deployment will take 5-10 minutes

4. **Update CORS settings** (after deployment completes)
   - Go to the `beacon-api` service settings
   - Add environment variable:
     - Key: `CORS_ORIGIN`
     - Value: Your dashboard URL (e.g., `https://beacon-dashboard.onrender.com`)
   - Save changes

5. **Add IPinfo API Token** (optional, for company identification)
   - Go to the `beacon-api` service settings
   - Add environment variable:
     - Key: `IPINFO_API_TOKEN`
     - Value: Your IPinfo API token from https://ipinfo.io
   - Save changes

### Option 2: Manual Deployment

If you prefer to set up services individually:

#### 1. Create PostgreSQL Database
- Click "New +" → "PostgreSQL"
- Name: `beacon-db`
- Database Name: `beacon`
- Plan: Starter (Free)
- Click "Create Database"
- Save the **Internal Database URL** for later

#### 2. Create Redis Instance
- Click "New +" → "Redis"
- Name: `beacon-redis`
- Plan: Starter (Free)
- Click "Create Redis"
- Save the **Internal Redis URL** for later

#### 3. Deploy Backend API
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - Name: `beacon-api`
  - Environment: Node
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Plan: Starter (Free)
- Add environment variables:
  - `NODE_ENV` = `production`
  - `PORT` = `3000`
  - `DATABASE_URL` = [Internal Database URL from step 1]
  - `REDIS_URL` = [Internal Redis URL from step 2]
  - `CORS_ORIGIN` = [Your frontend URL, e.g., https://beacon-dashboard.onrender.com]
- Click "Create Web Service"

#### 4. Deploy Frontend Dashboard
- Click "New +" → "Static Site"
- Connect your GitHub repository
- Configure:
  - Name: `beacon-dashboard`
  - Build Command: `cd frontend && npm install && npm run build`
  - Publish Directory: `frontend/dist`
- Add environment variable:
  - `VITE_API_URL` = [Your backend URL, e.g., https://beacon-api.onrender.com]
- Click "Create Static Site"

## Post-Deployment Setup

### 1. Initialize Database Schema

After the backend API is deployed, you need to initialize the database:

```bash
# Connect to your Render shell (from the beacon-api service page)
npm run migrate
```

Or run the SQL schema directly in the Render PostgreSQL dashboard:
- Go to your `beacon-db` database
- Click "Connect" → "External Connection"
- Use a PostgreSQL client to run the contents of `config/schema.sql`

### 2. Test Your Deployment

Visit your dashboard URL (e.g., `https://beacon-dashboard.onrender.com`)

### 3. Install Tracking Script on Your Website

Add this script tag to your website's `<head>`:

```html
<script>
  (function() {
    window.beaconConfig = {
      apiEndpoint: 'https://beacon-api.onrender.com',
      siteId: 'your-site-id-here',  // Get this from your dashboard
      debug: false
    };
    var script = document.createElement('script');
    script.src = 'https://beacon-api.onrender.com/beacon.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

## Configuration

### Environment Variables

#### Backend (beacon-api)
- `NODE_ENV` - Set to `production`
- `PORT` - Port number (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Render)
- `REDIS_URL` - Redis connection string (auto-configured by Render)
- `CORS_ORIGIN` - Frontend dashboard URL
- `IPINFO_API_TOKEN` - (Optional) IPinfo API token for company identification
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

#### Frontend (beacon-dashboard)
- `VITE_API_URL` - Backend API URL

## Troubleshooting

### Backend not connecting to database
- Check that `DATABASE_URL` is set correctly
- Verify the PostgreSQL service is running
- Check logs in the Render dashboard

### Frontend showing blank page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check that CORS is configured on the backend

### Rate limiting issues
- Adjust `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
- Consider upgrading to a paid plan for higher limits

## Upgrading

To deploy updates:

1. Push changes to your GitHub repository:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. Render will automatically detect the changes and redeploy

## Support

For issues or questions:
- Check the logs in the Render dashboard
- Review the API health endpoint: `https://beacon-api.onrender.com/api/health`
- Contact Hype Insight support

## Costs

Free tier limits on Render:
- Web Services: 750 hours/month (sleeps after 15 min of inactivity)
- PostgreSQL: 90 days of storage
- Redis: 25 MB storage

Consider upgrading to paid plans for production use.
