/**
 * Diagnose why Meta events aren't being forwarded
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

async function diagnose() {
  console.log('\n=== META FORWARDING DIAGNOSIS ===\n');

  try {
    // 1. Check site configuration details
    const siteQuery = `
      SELECT 
        id,
        name,
        domain,
        script_id,
        is_connected,
        first_event_at,
        config
      FROM sites
      WHERE config->'destinations'->'meta'->>'enabled' = 'true'
    `;
    
    const siteResult = await pool.query(siteQuery);
    
    if (siteResult.rows.length === 0) {
      console.log('❌ NO SITES HAVE META ENABLED IN DATABASE!');
      console.log('   This is the problem - Meta integration is not saved in the config.\n');
      console.log('   To fix: Go to Integrations page → Enable Meta → Save\n');
      return;
    }
    
    console.log('📊 SITE WITH META ENABLED:\n');
    const site = siteResult.rows[0];
    console.log(`Name: ${site.name}`);
    console.log(`Domain: ${site.domain}`);
    console.log(`Script ID: ${site.script_id}`);
    console.log(`Connected: ${site.is_connected ? 'Yes' : 'No'}`);
    console.log(`First Event: ${site.first_event_at || 'Never'}`);
    console.log('');
    
    // 2. Show full Meta configuration
    const metaConfig = site.config?.destinations?.meta;
    console.log('🔧 META CONFIGURATION:\n');
    console.log(JSON.stringify(metaConfig, null, 2));
    console.log('');
    
    // 3. Check if required fields are present
    console.log('✅ CONFIGURATION VALIDATION:\n');
    const issues = [];
    
    if (!metaConfig.datasetId && !metaConfig.pixelId) {
      issues.push('❌ Missing Dataset ID (or Pixel ID)');
    } else {
      console.log(`✓ Dataset ID: ${metaConfig.datasetId || metaConfig.pixelId}`);
    }
    
    if (!metaConfig.accessToken) {
      // Check for agency token
      const agencyQuery = `
        SELECT config->'meta'->>'systemUserToken' as token
        FROM agencies
        WHERE id = (SELECT agency_id FROM sites WHERE id = $1)
      `;
      const agencyResult = await pool.query(agencyQuery, [site.id]);
      
      if (agencyResult.rows.length && agencyResult.rows[0].token) {
        console.log('✓ Using Agency System User Token');
      } else {
        issues.push('❌ No Access Token (site-level or agency-level)');
      }
    } else {
      console.log(`✓ Site Access Token: ${metaConfig.accessToken.substring(0, 15)}...`);
    }
    
    console.log(`✓ Action Source: ${metaConfig.actionSource || 'website (default)'}`);
    console.log(`✓ Enabled: ${metaConfig.enabled}`);
    console.log('');
    
    // 4. Check recent events for this site
    const eventsQuery = `
      SELECT 
        id,
        event_name,
        created_at,
        event_timestamp,
        client_id,
        session_id
      FROM events
      WHERE site_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const eventsResult = await pool.query(eventsQuery, [site.id]);
    
    console.log('📈 RECENT EVENTS FOR THIS SITE:\n');
    if (eventsResult.rows.length === 0) {
      console.log('❌ NO EVENTS FOUND FOR THIS SITE!');
      console.log('   This means events are not being saved with the correct site_id.\n');
      console.log(`   Expected site_id: ${site.id}`);
      console.log(`   Script ID: ${site.script_id}`);
      console.log('');
      console.log('   Possible causes:');
      console.log('   1. Tracking script not installed on website');
      console.log('   2. Script using wrong site ID');
      console.log('   3. Site is inactive\n');
    } else {
      console.log(`✓ Found ${eventsResult.rows.length} recent events\n`);
      eventsResult.rows.forEach((event, i) => {
        const timeAgo = new Date(event.created_at).toLocaleTimeString();
        console.log(`${i + 1}. ${event.event_name} at ${timeAgo}`);
      });
      console.log('');
    }
    
    // 5. Check all recent events (regardless of site)
    const allEventsQuery = `
      SELECT 
        site_id,
        event_name,
        COUNT(*) as count
      FROM events
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      GROUP BY site_id, event_name
      ORDER BY count DESC
    `;
    
    const allEventsResult = await pool.query(allEventsQuery);
    
    console.log('📊 ALL RECENT EVENTS (all sites, last 10 min):\n');
    if (allEventsResult.rows.length === 0) {
      console.log('❌ NO EVENTS AT ALL - Server may not be running or receiving events\n');
    } else {
      console.log('Events by site:\n');
      allEventsResult.rows.forEach(row => {
        const isMetaSite = row.site_id === site.id;
        const marker = isMetaSite ? '👉' : '  ';
        console.log(`${marker} Site: ${row.site_id.substring(0, 8)}... | ${row.event_name}: ${row.count} events`);
      });
      console.log('');
      
      const metaSiteEvents = allEventsResult.rows.filter(r => r.site_id === site.id);
      if (metaSiteEvents.length === 0) {
        console.log('⚠️  PROBLEM: Events are being received, but NOT for the Meta-enabled site!');
        console.log('   Events are going to a different site_id.\n');
      }
    }
    
    // 6. Final diagnosis
    console.log('\n=== DIAGNOSIS ===\n');
    
    if (issues.length > 0) {
      console.log('❌ CONFIGURATION ISSUES:\n');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    } else if (eventsResult.rows.length === 0) {
      console.log('❌ PROBLEM: Configuration looks good, but NO EVENTS for this site');
      console.log('   \n   LIKELY CAUSE: Tracking script is using wrong Site ID\n');
      console.log('   TO FIX:');
      console.log('   1. Check your website tracking code');
      console.log(`   2. Make sure it uses: beacon('init', '${site.script_id}');`);
      console.log(`   3. Current script_id for ${site.name}: ${site.script_id}\n`);
    } else {
      console.log('✅ CONFIGURATION LOOKS GOOD!');
      console.log('   Events ARE being received for this site.');
      console.log('   Meta integration should be working.\n');
      console.log('   If events still not appearing in Meta:');
      console.log('   1. Check server logs for [Meta] messages');
      console.log('   2. Verify token hasn\'t expired');
      console.log('   3. Wait 5-10 minutes for Meta to process\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnose();
