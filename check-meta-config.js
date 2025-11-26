/**
 * Diagnostic script to check Meta integration configuration
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkMetaConfig() {
  console.log('\n=== CHECKING META INTEGRATION CONFIGURATION ===\n');

  try {
    // Check sites with Meta enabled
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
    
    console.log(`Found ${sitesResult.rows.length} site(s) with Meta enabled:\n`);
    
    if (sitesResult.rows.length === 0) {
      console.log('❌ NO SITES HAVE META ENABLED');
      console.log('   → Go to Integrations page and enable Meta Conversions API\n');
    }
    
    sitesResult.rows.forEach((site, i) => {
      const meta = site.meta_config || {};
      console.log(`${i + 1}. Site: ${site.name} (${site.domain})`);
      console.log(`   ID: ${site.id}`);
      console.log(`   Dataset ID: ${meta.datasetId || meta.pixelId || '❌ NOT SET'}`);
      console.log(`   Access Token: ${meta.accessToken ? '✓ Set (length: ' + meta.accessToken.length + ')' : '❌ NOT SET'}`);
      console.log(`   Action Source: ${meta.actionSource || 'website (default)'}`);
      console.log('');
    });

    // Check agency System User token
    const agencyQuery = `
      SELECT 
        id,
        name,
        config->'meta'->>'systemUserToken' as system_token
      FROM agencies
      LIMIT 1
    `;
    
    const agencyResult = await pool.query(agencyQuery);
    
    if (agencyResult.rows.length > 0) {
      const agency = agencyResult.rows[0];
      console.log('Agency Configuration:');
      console.log(`  Agency: ${agency.name}`);
      console.log(`  System User Token: ${agency.system_token ? '✓ Set (ends with ...' + agency.system_token.slice(-4) + ')' : '❌ NOT SET'}`);
      console.log('');
    }

    // Check recent events
    const eventsQuery = `
      SELECT 
        event_name,
        COUNT(*) as count,
        MAX(timestamp) as last_seen
      FROM events
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const eventsResult = await pool.query(eventsQuery);
    
    console.log('\nRecent Events (last hour):');
    if (eventsResult.rows.length === 0) {
      console.log('  ❌ NO EVENTS in the last hour');
      console.log('  → Make sure tracking script is installed and website is being visited\n');
    } else {
      eventsResult.rows.forEach(event => {
        console.log(`  - ${event.event_name}: ${event.count} events (last: ${new Date(event.last_seen).toLocaleTimeString()})`);
      });
      console.log('');
    }

    // Summary
    console.log('\n=== SUMMARY ===\n');
    const hasMetaEnabled = sitesResult.rows.length > 0;
    const hasDatasetId = sitesResult.rows.some(s => {
      const meta = s.meta_config || {};
      return meta.datasetId || meta.pixelId;
    });
    const hasToken = sitesResult.rows.some(s => {
      const meta = s.meta_config || {};
      return meta.accessToken;
    }) || (agencyResult.rows.length > 0 && agencyResult.rows[0].system_token);
    const hasEvents = eventsResult.rows.length > 0;

    console.log(`Meta Enabled:  ${hasMetaEnabled ? '✓' : '❌'}`);
    console.log(`Dataset ID Set: ${hasDatasetId ? '✓' : '❌'}`);
    console.log(`Token Set:     ${hasToken ? '✓' : '❌'}`);
    console.log(`Events Flowing: ${hasEvents ? '✓' : '❌'}`);
    
    if (hasMetaEnabled && hasDatasetId && hasToken && hasEvents) {
      console.log('\n✅ Configuration looks good! Events should be flowing to Meta.');
      console.log('   Check server logs for: [Meta] Event sent successfully\n');
    } else {
      console.log('\n❌ Configuration incomplete. Fix the issues above.\n');
    }

  } catch (error) {
    console.error('Error checking configuration:', error.message);
  } finally {
    await pool.end();
  }
}

checkMetaConfig();
