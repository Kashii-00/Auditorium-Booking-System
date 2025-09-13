#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.outputDir = path.join(__dirname, 'extracted_backups');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // List all available backups
  listBackups() {
    console.log('🗂️  AVAILABLE BACKUPS');
    console.log('==================');
    
    if (!fs.existsSync(this.backupDir)) {
      console.log('❌ Backup directory not found');
      return [];
    }

    const allFiles = fs.readdirSync(this.backupDir);
    const backupFiles = allFiles.filter(file => file.endsWith('.sql.gz'));
    
    const files = backupFiles
      .map((file, index) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const type = file.includes('incremental') ? 'Incremental' : 'Full';
        
        return {
          filename: file,
          path: filePath,
          type,
          size: this.formatBytes(stats.size),
          created: stats.birthtime.toLocaleString(),
          index: index + 1
        };
      })
      .sort((a, b) => fs.statSync(b.path).birthtime - fs.statSync(a.path).birthtime);

    files.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.filename}`);
      console.log(`   Type: ${backup.type}`);
      console.log(`   Size: ${backup.size}`);
      console.log(`   Created: ${backup.created}`);
      console.log('');
    });

    return files;
  }

  // Extract a backup to readable SQL file
  async extractBackup(filename, outputName = null) {
    try {
      console.log(`📤 EXTRACTING BACKUP: ${filename}`);
      console.log('================================');

      const inputPath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      // Generate output filename
      const baseName = filename.replace('.sql.gz', '');
      const outputFileName = outputName || `${baseName}_extracted.sql`;
      const outputPath = path.join(this.outputDir, outputFileName);

      console.log('⏳ Extracting compressed backup...');
      await execAsync(`gunzip -c "${inputPath}" > "${outputPath}"`);

      const stats = fs.statSync(outputPath);
      console.log('✅ Extraction completed successfully!');
      console.log(`   Input: ${filename} (${this.formatBytes(fs.statSync(inputPath).size)})`);
      console.log(`   Output: ${outputFileName} (${this.formatBytes(stats.size)})`);
      console.log(`   Location: ${outputPath}`);
      console.log(`   Lines: ${await this.countLines(outputPath)}`);

      return outputPath;
    } catch (error) {
      console.log('❌ Extraction failed:', error.message);
      throw error;
    }
  }

  // View backup content (first N lines)
  async viewBackup(filename, lines = 50) {
    try {
      console.log(`👁️  VIEWING BACKUP: ${filename} (First ${lines} lines)`);
      console.log('='.repeat(60));

      const inputPath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      const { stdout } = await execAsync(`gunzip -c "${inputPath}" | head -${lines}`);
      console.log(stdout);
      
      console.log('='.repeat(60));
      console.log(`📊 Showing first ${lines} lines. Use viewAll() to extract complete file.`);
      
    } catch (error) {
      console.log('❌ View failed:', error.message);
    }
  }

  // Search for specific content in backup
  async searchBackup(filename, searchTerm, context = 5) {
    try {
      console.log(`🔍 SEARCHING IN BACKUP: ${filename}`);
      console.log(`Search term: "${searchTerm}"`);
      console.log('='.repeat(50));

      const inputPath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      const { stdout } = await execAsync(`gunzip -c "${inputPath}" | grep -A ${context} -B ${context} "${searchTerm}"`);
      
      if (stdout.trim()) {
        console.log(stdout);
      } else {
        console.log(`❌ No matches found for "${searchTerm}"`);
      }
      
    } catch (error) {
      if (error.code === 1) {
        console.log(`❌ No matches found for "${searchTerm}"`);
      } else {
        console.log('❌ Search failed:', error.message);
      }
    }
  }

  // Get table data from backup
  async getTableData(filename, tableName, limit = 10) {
    try {
      console.log(`🗃️  TABLE DATA: ${tableName} from ${filename}`);
      console.log('='.repeat(50));

      const inputPath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      // Search for INSERT statements for the specific table
      const { stdout } = await execAsync(`gunzip -c "${inputPath}" | grep "INSERT INTO \\\`${tableName}\\\`" | head -${limit}`);
      
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        console.log(`Found ${lines.length} INSERT statements for table '${tableName}':`);
        console.log('');
        
        lines.forEach((line, index) => {
          console.log(`${index + 1}. ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        });
      } else {
        console.log(`❌ No data found for table "${tableName}"`);
      }
      
    } catch (error) {
      console.log('❌ Table data retrieval failed:', error.message);
    }
  }

  // Get backup statistics
  async getBackupStats(filename) {
    try {
      console.log(`📊 BACKUP STATISTICS: ${filename}`);
      console.log('='.repeat(40));

      const inputPath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      // Get various statistics
      const [
        totalLines,
        tableCount,
        insertCount,
        createCount
      ] = await Promise.all([
        execAsync(`gunzip -c "${inputPath}" | wc -l`).then(r => parseInt(r.stdout.trim())),
        execAsync(`gunzip -c "${inputPath}" | grep "CREATE TABLE" | wc -l`).then(r => parseInt(r.stdout.trim())),
        execAsync(`gunzip -c "${inputPath}" | grep "INSERT INTO" | wc -l`).then(r => parseInt(r.stdout.trim())),
        execAsync(`gunzip -c "${inputPath}" | grep "CREATE" | wc -l`).then(r => parseInt(r.stdout.trim()))
      ]);

      const fileStats = fs.statSync(inputPath);
      
      console.log(`📁 File: ${filename}`);
      console.log(`📏 Compressed Size: ${this.formatBytes(fileStats.size)}`);
      console.log(`📅 Created: ${fileStats.birthtime.toLocaleString()}`);
      console.log(`📝 Total Lines: ${totalLines.toLocaleString()}`);
      console.log(`🗃️  Tables Created: ${tableCount}`);
      console.log(`📊 INSERT Statements: ${insertCount.toLocaleString()}`);
      console.log(`🔧 CREATE Statements: ${createCount}`);
      
      // Get table names
      const { stdout: tableNames } = await execAsync(`gunzip -c "${inputPath}" | grep "CREATE TABLE" | sed 's/.*\\\`\\([^\\\`]*\\)\\\`.*/\\1/' | sort`);
      console.log(`\n🏷️  Tables in backup:`);
      tableNames.trim().split('\n').forEach((table, index) => {
        if (table.trim()) {
          console.log(`   ${index + 1}. ${table.trim()}`);
        }
      });

    } catch (error) {
      console.log('❌ Statistics failed:', error.message);
    }
  }

  // Compare two backups
  async compareBackups(file1, file2) {
    try {
      console.log(`🔍 COMPARING BACKUPS`);
      console.log(`File 1: ${file1}`);
      console.log(`File 2: ${file2}`);
      console.log('='.repeat(50));

      const path1 = path.join(this.backupDir, file1);
      const path2 = path.join(this.backupDir, file2);

      if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
        throw new Error('One or both backup files not found');
      }

      // Extract both files temporarily
      const temp1 = `/tmp/backup1_${Date.now()}.sql`;
      const temp2 = `/tmp/backup2_${Date.now()}.sql`;

      await execAsync(`gunzip -c "${path1}" > "${temp1}"`);
      await execAsync(`gunzip -c "${path2}" > "${temp2}"`);

      // Compare file sizes
      const stats1 = fs.statSync(temp1);
      const stats2 = fs.statSync(temp2);

      console.log(`📊 Size Comparison:`);
      console.log(`   ${file1}: ${this.formatBytes(stats1.size)}`);
      console.log(`   ${file2}: ${this.formatBytes(stats2.size)}`);
      console.log(`   Difference: ${this.formatBytes(Math.abs(stats1.size - stats2.size))}`);

      // Compare content (basic diff)
      try {
        const { stdout: diffOutput } = await execAsync(`diff "${temp1}" "${temp2}" | head -20`);
        if (diffOutput.trim()) {
          console.log(`\n📝 Content Differences (first 20 lines):`);
          console.log(diffOutput);
        } else {
          console.log(`\n✅ Files are identical`);
        }
      } catch (diffError) {
        console.log(`\n⚠️  Files have differences (too many to display)`);
      }

      // Cleanup
      fs.unlinkSync(temp1);
      fs.unlinkSync(temp2);

    } catch (error) {
      console.log('❌ Comparison failed:', error.message);
    }
  }

  // Utility functions
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async countLines(filePath) {
    try {
      const { stdout } = await execAsync(`wc -l < "${filePath}"`);
      return parseInt(stdout.trim()).toLocaleString();
    } catch {
      return 'Unknown';
    }
  }

  // Interactive menu
  async showMenu() {
    console.log('\n🛠️  BACKUP MANAGER - INTERACTIVE MODE');
    console.log('=====================================');
    console.log('Available commands:');
    console.log('1. list() - List all backups');
    console.log('2. view(filename, lines) - View backup content');
    console.log('3. extract(filename) - Extract backup to SQL file');
    console.log('4. search(filename, term) - Search in backup');
    console.log('5. getTable(filename, tableName) - Get table data');
    console.log('6. stats(filename) - Get backup statistics');
    console.log('7. compare(file1, file2) - Compare two backups');
    console.log('\nExample: manager.view("event_management_backup_2025-07-28T04-17-13-037Z.sql.gz")');
    console.log('');
  }
}

// Create instance and export methods
const manager = new BackupManager();

// Export individual methods for easy use
module.exports = {
  list: () => manager.listBackups(),
  view: (filename, lines) => manager.viewBackup(filename, lines),
  extract: (filename, outputName) => manager.extractBackup(filename, outputName),
  search: (filename, term, context) => manager.searchBackup(filename, term, context),
  getTable: (filename, tableName, limit) => manager.getTableData(filename, tableName, limit),
  stats: (filename) => manager.getBackupStats(filename),
  compare: (file1, file2) => manager.compareBackups(file1, file2),
  menu: () => manager.showMenu(),
  manager: manager
};

// If run directly, show menu
if (require.main === module) {
  manager.showMenu();
}
