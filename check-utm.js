const {Pool} = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://beacon_db_9bq8_user:nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI@dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com/beacon_db_9bq8',
    ssl: { rejectUnauthorized: false }
  });

  const result = await pool.query(`
    SELECT 
      event_name,
      properties
    FROM events 
    WHERE event_name = 'page_view'
    ORDER BY server_timestamp DESC
    LIMIT 1
  `);

  console.log('\nLatest page_view event properties:');
  console.log(JSON.stringify(result.rows[0]?.properties, null, 2));

  await pool.end();
})();
