/**
 * Promote a user to super_admin role
 * Usage: node src/utils/makeSuperAdmin.js <email>
 */
const db = require('../../config/database');

async function makeSuperAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node src/utils/makeSuperAdmin.js <email>');
    process.exit(1);
  }

  try {
    const result = await db.query(
      'UPDATE dashboard_users SET role = $1 WHERE email = $2 RETURNING id, email, name, role',
      ['super_admin', email]
    );

    if (result.rows.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✓ User promoted to super_admin:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeSuperAdmin();
