/**
 * Run database migration to add password reset columns
 */
const db = require('../../config/database');

async function runMigration() {
  try {
    console.log('Running migration: Add password reset columns...');
    
    // Add reset_token column
    await db.query(`
      ALTER TABLE dashboard_users 
      ADD COLUMN IF NOT EXISTS reset_token TEXT
    `);
    console.log('✓ Added reset_token column');
    
    // Add reset_token_expiry column
    await db.query(`
      ALTER TABLE dashboard_users 
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    console.log('✓ Added reset_token_expiry column');

    // Add index for faster token lookups
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_dashboard_users_reset_token 
      ON dashboard_users(reset_token) 
      WHERE reset_token IS NOT NULL
    `);
    console.log('✓ Added index on reset_token');
    
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
