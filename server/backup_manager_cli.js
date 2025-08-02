#!/usr/bin/env node

const backupManager = require('./backup_manager');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🛠️  BACKUP MANAGER UTILITY');
    console.log('===========================\n');
    
    // Show available backups first
    const backups = backupManager.list();
    
    console.log('\n📖 USAGE EXAMPLES:');
    console.log('==================');
    console.log('node backup_manager_cli.js list');
    console.log('node backup_manager_cli.js view <filename> [lines]');
    console.log('node backup_manager_cli.js extract <filename>');
    console.log('node backup_manager_cli.js search <filename> <search_term>');
    console.log('node backup_manager_cli.js table <filename> <table_name>');
    console.log('node backup_manager_cli.js stats <filename>');
    console.log('node backup_manager_cli.js compare <file1> <file2>');
    
    if (backups.length > 0) {
      console.log('\n🎯 QUICK COMMANDS FOR YOUR BACKUPS:');
      console.log('====================================');
      backups.slice(0, 2).forEach((backup, index) => {
        console.log(`\n${index + 1}. Latest ${backup.type} Backup (${backup.filename}):`);
        console.log(`   View: node backup_manager_cli.js view "${backup.filename}"`);
        console.log(`   Extract: node backup_manager_cli.js extract "${backup.filename}"`);
        console.log(`   Stats: node backup_manager_cli.js stats "${backup.filename}"`);
        console.log(`   Search: node backup_manager_cli.js search "${backup.filename}" "users"`);
      });
    }
    
    return;
  }

  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'list':
      case 'l':
        backupManager.list();
        break;
        
      case 'view':
      case 'v':
        if (!args[1]) {
          console.log('❌ Please provide filename: node backup_manager_cli.js view <filename> [lines]');
          return;
        }
        const lines = args[2] ? parseInt(args[2]) : 50;
        await backupManager.view(args[1], lines);
        break;
        
      case 'extract':
      case 'e':
        if (!args[1]) {
          console.log('❌ Please provide filename: node backup_manager_cli.js extract <filename>');
          return;
        }
        await backupManager.extract(args[1]);
        break;
        
      case 'search':
      case 's':
        if (!args[1] || !args[2]) {
          console.log('❌ Please provide filename and search term: node backup_manager_cli.js search <filename> <term>');
          return;
        }
        await backupManager.search(args[1], args[2]);
        break;
        
      case 'table':
      case 't':
        if (!args[1] || !args[2]) {
          console.log('❌ Please provide filename and table name: node backup_manager_cli.js table <filename> <table_name>');
          return;
        }
        const limit = args[3] ? parseInt(args[3]) : 10;
        await backupManager.getTable(args[1], args[2], limit);
        break;
        
      case 'stats':
      case 'st':
        if (!args[1]) {
          console.log('❌ Please provide filename: node backup_manager_cli.js stats <filename>');
          return;
        }
        await backupManager.stats(args[1]);
        break;
        
      case 'compare':
      case 'c':
        if (!args[1] || !args[2]) {
          console.log('❌ Please provide two filenames: node backup_manager_cli.js compare <file1> <file2>');
          return;
        }
        await backupManager.compare(args[1], args[2]);
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Available commands: list, view, extract, search, table, stats, compare');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main();
