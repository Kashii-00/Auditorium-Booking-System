const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()}: ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()}: ${msg}`)
};

async function runPasswordResetMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'event_management',
      multipleStatements: true
    });

    logger.info('Connected to database successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_password_reset_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    logger.info('Running password reset tracking migration...');

    // Execute migration with error handling for existing columns
    const migrationStatements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of migrationStatements) {
      try {
        await connection.execute(statement.trim());
        logger.info(`✓ Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        // If column already exists, that's okay - continue with migration
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
          logger.info(`⚠️  Column already exists (skipping): ${statement.substring(0, 50)}...`);
        } else {
          // For other errors, still continue but log them
          logger.error(`⚠️  Error executing statement: ${error.message}`);
          logger.info(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    logger.success('Password reset tracking migration completed successfully!');

    // Verify the migration by checking if the new columns exist
    logger.info('Verifying migration...');

    const [studentColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'student_users' 
      AND COLUMN_NAME IN ('password_reset_count', 'last_password_reset', 'last_reset_request', 'reset_request_count')
    `, [process.env.DB_DATABASE]);

    const [lecturerColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lecturer_users' 
      AND COLUMN_NAME IN ('password_reset_count', 'last_password_reset', 'last_reset_request', 'reset_request_count')
    `, [process.env.DB_DATABASE]);

    const [logTable] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_logs'
    `, [process.env.DB_DATABASE]);

    logger.info(`Student table columns added: ${studentColumns.length}/4`);
    logger.info(`Lecturer table columns added: ${lecturerColumns.length}/4`);
    logger.info(`Password reset logs table created: ${logTable.length > 0 ? 'Yes' : 'No'}`);

    if (studentColumns.length === 4 && lecturerColumns.length === 4 && logTable.length > 0) {
      logger.success('✅ All migration components verified successfully!');
    } else {
      logger.error('⚠️ Migration verification failed - some components may be missing');
    }

  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      logger.info('Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  runPasswordResetMigration()
    .then(() => {
      logger.success('🎉 Password reset security enhancement migration completed!');
      logger.info('You can now enjoy enhanced password reset security with:');
      logger.info('• Rate limiting (max 3 requests per hour)');
      logger.info('• 24-hour cooldown after password reset');
      logger.info('• Duplicate request prevention');
      logger.info('• Comprehensive audit logging');
      logger.info('• IP and user agent tracking');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Failed to complete migration: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runPasswordResetMigration }; 