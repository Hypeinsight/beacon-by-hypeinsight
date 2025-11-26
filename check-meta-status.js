/**
 * Check Meta configuration and recent events
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: 'dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com',
  port: 5432,
  database: 'beacon_db_9bq8',
  user: 'beacon_db_9bq8_user',
  password: 'nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI',
  ssl: { rejectUnauthorized: false }
});

async function checkStatus() {
  console.log('\n=== META INTEGRATION STATUS CHECK ===\n');

  try {
    // 1. Check sites with Meta enabled
    const sitesQuery = `
      SELECT 
        id,
        name,
        domain,
        config->'destinations'->'meta' as meta_config
      FROM sites
      WHERE config->'destinations'->'meta'->>'enabled' = 'true'
    `;
    
    const sitesResult = await pool.query(sitesQuery);
    
    console.log('📊 SITES WITH META ENABLED:', sitesResult.rows.length);
    console.log('');
    
    if (sitesResult.rows.length === 0) {
      console.log('❌ NO SITES HAVE META ENABLED!');
      console.log('   Fix: Go to Integrations page → Enable Meta Conversions API\n');
    } else {
      sitesResult.rows.forEach((site, i) => {
        const meta = site.meta_config || {};
        console.log(`Site ${i + 1}: ${site.name}`);
        console.log(`  Domain: ${site.domain}`);
        console.log(`  Dataset ID: ${meta.datasetId || meta.pixelId || '❌ MISSING'}`);
        console.log(`  Access Token: ${meta.accessToken ? '✓ Set (' + meta.accessToken.substring(0, 10) + '...)' : '❌ MISSING'}`);
        console.log(`  Action Source: ${meta.actionSource || 'website'}`);
        console.log('');
      });
    }

    // 2. Check agency token
    const agencyQuery = `
      SELECT 
        id,
        name,
        config->'meta'->>'systemUserToken' as token
      FROM agencies
      LIMIT 1
    `;
    
    const agencyResult = await pool.query(agencyQuery);
    
    if (agencyResult.rows.length > 0 && agencyResult.rows[0].token) {
      console.log('🏢 AGENCY SYSTEM USER TOKEN:');
      console.log(`  ✓ Configured (ends with ...${agencyResult.rows[0].token.slice(-4)})`);
      console.log('');
    }

    // 3. Check recent events (last 10 minutes)
    const eventsQuery = `
      SELECT 
        event_name,
        COUNT(*) as count,
        MAX(created_at) as latest
      FROM events
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      GROUP BY event_name
      ORDER BY latest DESC
    `;
    
    const eventsResult = await pool.query(eventsQuery);
    
    console.log('📈 RECENT EVENTS (last 10 minutes):');
    if (eventsResult.rows.length === 0) {
      console.log('  ❌ NO EVENTS RECEIVED!');
      console.log('  → Check if tracking script is installed on website');
      console.log('  → Check if website is being visited\n');
    } else {
      console.log(`  ✓ ${eventsResult.rows.length} event type(s) received\n`);
      eventsResult.rows.forEach(event => {
        const timeAgo = new Date(event.latest).toLocaleTimeString();
        console.log(`  • ${event.event_name}: ${event.count} events (latest: ${timeAgo})`);
      });
      console.log('');
    }

    // 4. Check all sites (to see which ones exist)
    const allSitesQuery = `
      SELECT 
        id,
        name,
        domain,
        config->'destinations'->'meta'->>'enabled' as meta_enabled
      FROM sites
    `;
    
    const allSites = await pool.query(allSitesQuery);
    
    console.log('🌐 ALL SITES IN DATABASE:', allSites.rows.length);
    console.log('');
    allSites.rows.forEach((site, i) => {
      console.log(`  ${i + 1}. ${site.name} (${site.domain})`);
      console.log(`     Meta: ${site.meta_enabled === 'true' ? '✓ Enabled' : '✗ Disabled'}`);
    });
    console.log('');

    // 5. Summary
    console.log('\n=== DIAGNOSIS ===\n');
    
    const hasMetaEnabled = sitesResult.rows.length > 0;
    const hasDatasetId = sitesResult.rows.some(s => {
      const meta = s.meta_config || {};
      return meta.datasetId || meta.pixelId;
    });
    const hasToken = sitesResult.rows.some(s => {
      const meta = s.meta_config || {};
      return meta.accessToken;
    }) || (agencyResult.rows.length > 0 && agencyResult.rows[0].token);
    const hasEvents = eventsResult.rows.length > 0;

    if (!hasMetaEnabled) {
      console.log('❌ PROBLEM: Meta is not enabled for any sites');
      console.log('   FIX: Enable Meta in Integrations page\n');
    } else if (!hasDatasetId) {
      console.log('❌ PROBLEM: Dataset ID is missing');
      console.log('   FIX: Add Dataset ID in Integrations page\n');
    } else if (!hasToken) {
      console.log('❌ PROBLEM: No access token configured');
      console.log('   FIX: Add Access Token OR configure System User token\n');
    } else if (!hasEvents) {
      console.log('⚠️  PROBLEM: Configuration looks OK but no events are being received');
      console.log('   FIX: Check tracking script installation on website\n');
    } else {
      console.log('✅ CONFIGURATION LOOKS GOOD!');
      console.log('   Events are being received and should be sent to Meta.');
      console.log('   Check server logs for: [Meta] Event sent successfully\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStatus();
