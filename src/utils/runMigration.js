/**
 * Run database migration to add missing columns
 */
const db = require('../../config/database');

async function runMigration() {
  try {
    console.log('Running migration: Add site tracking columns...');
    
    // Add is_connected column
    await db.query(`
      ALTER TABLE sites 
      ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added is_connected column');
    
    // Add first_event_at column
    await db.query(`
      ALTER TABLE sites 
      ADD COLUMN IF NOT EXISTS first_event_at TIMESTAMP
    `);
    console.log('✓ Added first_event_at column');

    // Add deleted_at column (for soft deletes)
    await db.query(`
      ALTER TABLE sites 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
    `);
    console.log('✓ Added deleted_at column');
    
    // Update existing sites that have events
    await db.query(`
      UPDATE sites s
      SET is_connected = TRUE,
          first_event_at = (SELECT MIN(server_timestamp) FROM events WHERE site_id = s.id)
      WHERE EXISTS (SELECT 1 FROM events WHERE site_id = s.id)
        AND (is_connected IS FALSE OR is_connected IS NULL)
    `);
    console.log('✓ Updated existing sites with events');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
