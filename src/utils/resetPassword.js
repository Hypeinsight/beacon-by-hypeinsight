/**
 * Reset a user's password
 * Usage: node src/utils/resetPassword.js <email> <new-password>
 */
const db = require('../../config/database');
const bcrypt = require('bcrypt');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.error('Usage: node src/utils/resetPassword.js <email> <new-password>');
    process.exit(1);
  }

  try {
    // Check if user exists
    const userCheck = await db.query(
      'SELECT id, email, name FROM dashboard_users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE dashboard_users SET password_hash = $1 WHERE email = $2',
      [passwordHash, email]
    );

    const user = userCheck.rows[0];
    console.log('✓ Password reset successfully for:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  New password: ${newPassword}`);
    console.log('\n⚠️  Make sure to save this password securely!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
