const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com',
  port: 5432,
  database: 'beacon_db_9bq8',
  user: 'beacon_db_9bq8_user',
  password: 'nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI',
  ssl: { rejectUnauthorized: false }
});

async function createTestSite() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if agency exists
    let agencyResult = await client.query(`SELECT id FROM agencies WHERE email = 'info@hypeinsight.com'`);
    
    if (agencyResult.rows.length === 0) {
      agencyResult = await client.query(`
        INSERT INTO agencies (id, name, email, status)
        VALUES (gen_random_uuid(), 'Hype Insight', 'info@hypeinsight.com', 'active')
        RETURNING id
      `);
      console.log('Agency created');
    } else {
      console.log('Agency already exists');
    }

    const agencyId = agencyResult.rows[0].id;

    // Check if site exists
    const siteCheck = await client.query(`SELECT id FROM sites WHERE domain = 'hypeinsight.com'`);
    
    if (siteCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO sites (id, agency_id, name, domain, script_id, status)
        VALUES (gen_random_uuid(), $1, 'Hype Insight Website', 'hypeinsight.com', 'hypeinsight-prod', 'active')
      `, [agencyId]);
      console.log('Site created');
    } else {
      console.log('Site already exists');
    }

    // Show the site
    const result = await client.query(`
      SELECT s.id, s.script_id, s.name, s.domain, a.name as agency_name
      FROM sites s
      JOIN agencies a ON s.agency_id = a.id
      WHERE s.domain = 'hypeinsight.com'
    `);

    console.log('\n✅ Site created successfully:');
    console.log(result.rows[0]);
    console.log('\nUse this script_id in your tracking script:', result.rows[0].script_id);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

createTestSite();
