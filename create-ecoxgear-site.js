const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://beacon_db_9bq8_user:nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI@dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com:5432/beacon_db_9bq8',
  ssl: { rejectUnauthorized: false }
});

async function createSite() {
  try {
    // Get or create agency
    let agencyResult = await pool.query(`
      SELECT id, name FROM agencies WHERE email = 'info@hypeinsight.com'
    `);
    
    if (agencyResult.rows.length === 0) {
      agencyResult = await pool.query(`
        INSERT INTO agencies (name, email, status)
        VALUES ('Hype Insight', 'info@hypeinsight.com', 'active')
        RETURNING id, name
      `);
    }
    
    const agency = agencyResult.rows[0];
    console.log('✓ Agency:', agency.name, '-', agency.id);
    
    // Create site
    const siteResult = await pool.query(`
      INSERT INTO sites (agency_id, name, domain, script_id, status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (script_id) DO UPDATE 
      SET name = EXCLUDED.name, domain = EXCLUDED.domain
      RETURNING id, script_id, name, domain
    `, [agency.id, 'EcoXGear Australia', 'ecoxgear.com.au', 'ecoxgear-au']);
    
    const site = siteResult.rows[0];
    console.log('✓ Site created:', site.name);
    console.log('  - Domain:', site.domain);
    console.log('  - Script ID:', site.script_id);
    console.log('  - Site UUID:', site.id);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

createSite();
