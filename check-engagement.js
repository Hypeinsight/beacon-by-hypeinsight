const {Pool} = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://beacon_db_9bq8_user:nu6qUMkLBFubXwngGQLJTOrxDwiNcpOI@dpg-d47bmtmmcj7s73d9b75g-a.singapore-postgres.render.com/beacon_db_9bq8',
    ssl: { rejectUnauthorized: false }
  });

  const result = await pool.query(`
    SELECT 
      event_name,
      time_on_page_sec,
      engagement_time_msec,
      properties->>'time_on_page_sec' as props_time,
      properties->>'engagement_time_msec' as props_engagement
    FROM events 
    WHERE event_name = 'user_engagement'
    ORDER BY server_timestamp DESC
    LIMIT 5
  `);

  console.log('\n📊 User Engagement Events:\n');
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}.`);
    console.log(`   time_on_page_sec: ${row.time_on_page_sec}`);
    console.log(`   engagement_time_msec: ${row.engagement_time_msec}`);
    console.log(`   properties.time_on_page_sec: ${row.props_time}`);
    console.log(`   properties.engagement_time_msec: ${row.props_engagement}`);
    console.log('');
  });

  await pool.end();
})();
