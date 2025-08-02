const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const cron = require('node-cron');
const logger = require('../logger');
require('dotenv').config();

const execAsync = util.promisify(exec);

class DatabaseBackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      // Set secure permissions for backup directory
      try {
        fs.chmodSync(this.backupDir, 0o700);
      } catch (err) {
        logger.warn('Could not set backup directory permissions:', err.message);
      }
      logger.info('✅ Backup directory created');
    }
  }

  /**
   * Create a full database backup using mysqldump with optimizations
   */
  async createFullBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `event_management_backup_${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, backupFileName);

      logger.info('🔄 Starting full database backup...');

      // Test MySQL connection first
      await this.testMySQLConnection();

      // Enhanced mysqldump command optimized for MariaDB/XAMPP
      // Handle both standard MySQL and XAMPP installations
      const socketPath = fs.existsSync('/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock') 
        ? '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock'
        : '/tmp/mysql.sock';
        
      const dumpCommand = `mysqldump \\
        --host="${process.env.DB_HOST}" \\
        --port="${process.env.DB_PORT || 3306}" \\
        --socket="${socketPath}" \\
        --user="${process.env.DB_USER}" \\
        --password="${process.env.DB_PASSWORD}" \\
        --single-transaction \\
        --hex-blob \\
        --default-character-set=utf8mb4 \\
        --add-drop-table \\
        --complete-insert \\
        --quick \\
        --lock-tables=false \\
        --skip-lock-tables \\
        --skip-column-statistics \\
        --skip-events \\
        --skip-routines \\
        --skip-triggers \\
        --force \\
        --ignore-table="${process.env.DB_DATABASE}.batch_overview" \\
        --ignore-table="${process.env.DB_DATABASE}.student_announcements_with_status" \\
        --result-file="${backupPath}" \\
        "${process.env.DB_DATABASE}"`;

      logger.info(`Using MySQL socket: ${socketPath}`);
      logger.info(`Executing MariaDB-compatible backup...`);

      // Use setTimeout to allow other operations to execute
      await new Promise((resolve, reject) => {
        const process = exec(dumpCommand, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`MySQL dump failed: ${error.message}`));
          } else if (stderr && stderr.includes('ERROR')) {
            reject(new Error(`MySQL dump error: ${stderr}`));
          } else {
            resolve();
          }
        });
        
        // Allow other operations every 100ms
        const interval = setInterval(() => {
          setImmediate(() => {});
        }, 100);
        
        process.on('exit', () => {
          clearInterval(interval);
        });
      });

      // Verify backup file was created and has content
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        // Clean up empty file
        fs.unlinkSync(backupPath);
        throw new Error('Backup file is empty - MySQL connection may have failed');
      }

      if (stats.size < 1000) {
        // Backup is too small, likely contains only headers
        const content = fs.readFileSync(backupPath, 'utf8');
        if (!content.includes('CREATE TABLE') && !content.includes('INSERT INTO')) {
          fs.unlinkSync(backupPath);
          throw new Error('Backup contains no actual data - check database connection');
        }
      }

      // Compress the backup asynchronously
      await new Promise((resolve, reject) => {
        const gzipProcess = exec(`gzip "${backupPath}"`, (error) => {
          if (error) reject(error);
          else resolve();
        });
        
        // Allow other operations during compression
        const interval = setInterval(() => {
          setImmediate(() => {});
        }, 50);
        
        gzipProcess.on('exit', () => {
          clearInterval(interval);
        });
      });

      const compressedPath = `${backupPath}.gz`;
      const compressedStats = fs.statSync(compressedPath);

      logger.info(`✅ Database backup created: ${backupFileName}.gz (${(compressedStats.size / 1024 / 1024).toFixed(2)}MB)`);

      // Cleanup old backups (keep last 30 days) - run in background
      setImmediate(() => this.cleanupOldBackups().catch(err => logger.error('Cleanup error:', err)));

      return {
        success: true,
        filename: `${backupFileName}.gz`,
        size: compressedStats.size,
        path: compressedPath,
        created: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Full backup failed:', error);
      throw error;
    }
  }

  /**
   * Test MySQL connection before attempting backup
   */
  async testMySQLConnection() {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        timeout: 10000
      });

      // Test the connection
      await connection.execute('SELECT 1');
      await connection.end();
      
      logger.info('✅ MySQL connection test successful');
    } catch (error) {
      throw new Error(`MySQL connection failed: ${error.message}. Please ensure MySQL server is running and credentials are correct.`);
    }
  }

  /**
   * Create incremental backup (only changed data since last backup)
   */
  async createIncrementalBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `event_management_incremental_${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, backupFileName);

      logger.info('🔄 Starting incremental backup...');

      // Get last backup time from metadata
      const lastBackupTime = await this.getLastBackupTime();
      
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
      });

      // Export only data modified since last backup
      const tables = [
        'users', 'students', 'lecturers', 'courses', 'batches', 
        'aid_requests', 'aid_items', 'aid_handover',
        'classroom_booking_calendar', 'classroom_booking_dates',
        'payments_main_details', 'course_payments',
        'student_courses', 'lecturer_courses'
      ];
      
      let backupSQL = `-- Incremental Backup - ${new Date().toISOString()}\n`;
      backupSQL += `-- Last backup: ${lastBackupTime}\n`;
      backupSQL += `-- Generated by Event Management System\n\n`;

      let totalRecords = 0;

      for (const table of tables) {
        try {
          // Check if table has updated_at or created_at columns
          const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
          const hasUpdatedAt = columns.some(col => col.Field === 'updated_at');
          const hasCreatedAt = columns.some(col => col.Field === 'created_at');

          let whereClause = '';
          if (hasUpdatedAt && hasCreatedAt) {
            whereClause = `WHERE updated_at > '${lastBackupTime}' OR created_at > '${lastBackupTime}'`;
          } else if (hasCreatedAt) {
            whereClause = `WHERE created_at > '${lastBackupTime}'`;
          } else if (hasUpdatedAt) {
            whereClause = `WHERE updated_at > '${lastBackupTime}'`;
          } else {
            // Skip tables without timestamp columns for incremental backup
            continue;
          }

          const [rows] = await connection.execute(`SELECT * FROM ${table} ${whereClause}`);

          if (rows.length > 0) {
            backupSQL += `-- Table: ${table} (${rows.length} records)\n`;
            
            // Get primary key for ON DUPLICATE KEY UPDATE
            const [primaryKeys] = await connection.execute(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
              AND TABLE_NAME = '${table}' 
              AND COLUMN_KEY = 'PRI'
            `);
            
            for (const row of rows) {
              const columns = Object.keys(row);
              const columnsList = columns.map(col => `\`${col}\``).join(', ');
              const values = Object.values(row).map(v => {
                if (v === null) return 'NULL';
                if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
                return `'${String(v).replace(/'/g, "''")}'`;
              }).join(', ');
              
              // Use INSERT ... ON DUPLICATE KEY UPDATE for incremental updates
              if (primaryKeys.length > 0) {
                const updateClauses = columns
                  .filter(col => !primaryKeys.some(pk => pk.COLUMN_NAME === col))
                  .map(col => `\`${col}\` = VALUES(\`${col}\`)`)
                  .join(', ');
                
                backupSQL += `INSERT INTO \`${table}\` (${columnsList}) VALUES (${values})`;
                if (updateClauses) {
                  backupSQL += ` ON DUPLICATE KEY UPDATE ${updateClauses}`;
                }
                backupSQL += ';\n';
              } else {
                // Fallback to regular INSERT for tables without primary key
                backupSQL += `INSERT INTO \`${table}\` (${columnsList}) VALUES (${values});\n`;
              }
            }
            backupSQL += '\n';
            totalRecords += rows.length;
          }
        } catch (tableError) {
          logger.warn(`⚠️ Could not backup table ${table}:`, tableError.message);
        }
      }

      await connection.end();

      if (totalRecords === 0) {
        logger.info('ℹ️ No changes found since last backup');
        return {
          success: true,
          message: 'No changes found since last backup',
          records: 0
        };
      }

      fs.writeFileSync(backupPath, backupSQL);
      await execAsync(`gzip "${backupPath}"`);

      const compressedStats = fs.statSync(`${backupPath}.gz`);

      // Update last backup time
      await this.updateLastBackupTime();

      logger.info(`✅ Incremental backup created: ${backupFileName}.gz (${totalRecords} records, ${(compressedStats.size / 1024).toFixed(2)}KB)`);

      return {
        success: true,
        filename: `${backupFileName}.gz`,
        type: 'incremental',
        records: totalRecords,
        size: compressedStats.size
      };

    } catch (error) {
      logger.error('❌ Incremental backup failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old backup files and failed backups
   */
  async cleanupOldBackups(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;
      let deletedSize = 0;

      for (const file of files) {
        if (file === 'backup_metadata.json') continue;
        
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);

        // Delete empty files (failed backups)
        if (stats.size === 0) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`🗑️ Deleted empty backup file: ${file}`);
          continue;
        }

        // Delete old backups
        if (file.endsWith('.gz') && stats.birthtime < cutoffDate) {
          deletedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`🗑️ Deleted old backup: ${file}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`✅ Cleanup completed: ${deletedCount} old/failed backups removed (${(deletedSize / 1024 / 1024).toFixed(2)}MB freed)`);
      }

    } catch (error) {
      logger.error('❌ Backup cleanup failed:', error);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }

      logger.warn(`⚠️ Starting database restore from: ${backupFileName}`);

      // Decompress if needed
      let sqlFilePath = backupPath;
      if (backupPath.endsWith('.gz')) {
        sqlFilePath = backupPath.replace('.gz', '');
        await execAsync(`gunzip -c "${backupPath}" > "${sqlFilePath}"`);
      }

      // Restore database
      const restoreCommand = `mysql \\
        --host="${process.env.DB_HOST}" \\
        --user="${process.env.DB_USER}" \\
        --password="${process.env.DB_PASSWORD}" \\
        "${process.env.DB_DATABASE}" < "${sqlFilePath}"`;

      await execAsync(restoreCommand);

      // Cleanup temporary uncompressed file
      if (backupPath.endsWith('.gz') && fs.existsSync(sqlFilePath)) {
        fs.unlinkSync(sqlFilePath);
      }

      logger.info(`✅ Database restored from: ${backupFileName}`);

      return { 
        success: true, 
        message: 'Database restored successfully',
        restoredFrom: backupFileName
      };

    } catch (error) {
      logger.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Get available backup files
   */
  getAvailableBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql.gz'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            size: stats.size,
            sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
            created: stats.birthtime,
            type: file.includes('incremental') ? 'incremental' : 'full'
          };
        })
        .sort((a, b) => b.created - a.created);

      return files;
    } catch (error) {
      logger.error('❌ Failed to get backup list:', error);
      return [];
    }
  }

  /**
   * Schedule automatic backups with non-blocking execution
   */
  scheduleBackups() {
    // Daily full backup at 2 AM - Use setImmediate to prevent blocking
    cron.schedule('0 2 * * *', () => {
      setImmediate(async () => {
        logger.info('🕐 Starting scheduled daily backup...');
        try {
          await this.createFullBackup();
          logger.info('✅ Scheduled daily backup completed');
        } catch (error) {
          logger.error('❌ Scheduled daily backup failed:', error);
        }
      });
    }, {
      scheduled: true,
      timezone: "Asia/Colombo" // Adjust timezone as needed
    });

    // Incremental backup every 6 hours (reduced frequency to prevent blocking)
    cron.schedule('0 */6 * * *', () => {
      setImmediate(async () => {
        logger.info('🕐 Starting scheduled incremental backup...');
        try {
          await this.createIncrementalBackup();
          logger.info('✅ Scheduled incremental backup completed');
        } catch (error) {
          logger.error('❌ Scheduled incremental backup failed:', error);
        }
      });
    }, {
      scheduled: true,
      timezone: "Asia/Colombo"
    });

    // Weekly cleanup on Sundays at 3 AM
    cron.schedule('0 3 * * 0', () => {
      setImmediate(async () => {
        logger.info('🕐 Starting scheduled backup cleanup...');
        try {
          await this.cleanupOldBackups();
          logger.info('✅ Scheduled backup cleanup completed');
        } catch (error) {
          logger.error('❌ Scheduled backup cleanup failed:', error);
        }
      });
    }, {
      scheduled: true,
      timezone: "Asia/Colombo"
    });

    logger.info('📅 Backup schedules configured (non-blocking):');
    logger.info('   • Daily full backup: 2:00 AM');
    logger.info('   • Incremental backup: Every 6 hours');
    logger.info('   • Weekly cleanup: Sunday 3:00 AM');
  }

  /**
   * Initialize the backup service
   */
  init() {
    try {
      this.ensureBackupDirectory();
      this.scheduleBackups();
      logger.info('🔄 Database backup service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize backup service:', error);
      throw error;
    }
  }

  async getLastBackupTime() {
    const metadataPath = path.join(this.backupDir, 'backup_metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        return metadata.lastBackupTime || '1970-01-01 00:00:00';
      } catch (error) {
        logger.warn('Could not read backup metadata:', error.message);
        return '1970-01-01 00:00:00';
      }
    }
    
    return '1970-01-01 00:00:00';
  }

  async updateLastBackupTime() {
    const metadataPath = path.join(this.backupDir, 'backup_metadata.json');
    const metadata = {
      lastBackupTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      lastBackupTimestamp: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      logger.warn('Could not update backup metadata:', error.message);
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    try {
      const backups = this.getAvailableBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const fullBackups = backups.filter(b => b.type === 'full').length;
      const incrementalBackups = backups.filter(b => b.type === 'incremental').length;

      return {
        totalBackups: backups.length,
        fullBackups,
        incrementalBackups,
        totalSize,
        totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
        latestBackup: backups.length > 0 ? backups[0].created : null
      };
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      return null;
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDir() {
    return this.backupDir;
  }
}

module.exports = new DatabaseBackupService();
