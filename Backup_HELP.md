# 🚀 Backup Manager - Quick Reference

### 1. **List All Backups**
```bash
node backup_manager_cli.js list
```

### 2. **Extract Backup (Most Common)**
```bash
node backup_manager_cli.js extract "event_management_incremental_2025-09-05T06-30-00-066Z.sql.gz" //backup file
```
**Result**: Creates `extracted_backups/event_management_incremental_2025-09-05T06-30-00-066Z_extracted.sql`

### 3. **View Backup Content**
```bash
node backup_manager_cli.js view "event_management_incremental_2025-09-05T06-30-00-066Z.sql.gz" 20
```

### 4. **Get Table Data**
```bash
node backup_manager_cli.js table "event_management_incremental_2025-09-05T06-30-00-066Z.sql.gz" "students"
```

## 🎯 What Each Command Does

| Command | What It Does | Output Location |
|---------|--------------|-----------------|
| `list` | Shows all `.sql.gz` files with size/date | Console only |
| `extract` | **Decompresses** `.sql.gz` → `.sql` | `extracted_backups/` |
| `view` | Shows first N lines without saving | Console only |
| `table` | Shows data from specific table | Console only |

## ⚡ Quick Workflow

### **Step 1: See What's Available**
```bash
node backup_manager_cli.js list
```

### **Step 2: Extract the Backup**
```bash
node backup_manager_cli.js extract "event_management_incremental_2025-09-05T06-30-00-066Z.sql.gz"
```


## 🔍 Common Use Cases

### **View Backup Content** (`view` or `v`)
**Purpose**: Display the first N lines of a backup file without extracting
**Examples**:
```bash
# View first 50 lines (default)
node backup_manager_cli.js view "event_management_incremental_2025-09-05T06-30-00-066Z.sql.gz"
# View first 20 lines
node backup_manager_cli.js view "event_management_incremental_2025-09-05T06-30-00-066Z.sql.gz" 20


