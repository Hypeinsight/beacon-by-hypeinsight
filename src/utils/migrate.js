const fs = require('fs');
const path = require('path');
const db = require('../../config/database');

const migrate = async () => {
  try {
    console.log('🔄 Running database migrations...');

    const schemaPath = path.join(__dirname, '../../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await db.query(schema);

    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
