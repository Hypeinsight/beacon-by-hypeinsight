const {Pool} = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://beacon_db_9bq8_user:nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI@dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com/beacon_db_9bq8',
    ssl: { rejectUnauthorized: false }
  });

  const result = await pool.query(`
    SELECT 
      event_name,
      properties->>'element_text' as text,
      properties->>'element_id' as id,
      properties->>'element_type' as type
    FROM events 
    WHERE event_name = 'click'
    ORDER BY server_timestamp DESC
  `);

  console.log('\n📊 Click Events Captured:\n');
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.type}: "${row.text}" ${row.id ? `(id: ${row.id})` : ''}`);
  });

  await pool.end();
})();
