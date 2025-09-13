const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const backupService = require('../services/backupService');
const auth = require('../auth');
const logger = require('../logger');

// Role checking middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasAllowedRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions. Admin access required.' 
      });
    }

    next();
  };
};

// Middleware: Only admins can access backup endpoints
router.use(auth.authMiddleware);
router.use(requireRole(['ADMIN', 'SuperAdmin']));

/**
 * Create manual full backup
 */
router.post('/create/full', async (req, res) => {
  try {
    logger.info(`Manual full backup initiated by user: ${req.user.email}`);
    
    const result = await backupService.createFullBackup();
    
    res.json({
      success: true,
      message: 'Full backup created successfully',
      backup: result
    });

  } catch (error) {
    logger.error('Manual backup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error.message
    });
  }
});

/**
 * Create manual incremental backup
 */
router.post('/create/incremental', async (req, res) => {
  try {
    logger.info(`Manual incremental backup initiated by user: ${req.user.email}`);
    
    const result = await backupService.createIncrementalBackup();
    
    res.json({
      success: true,
      message: 'Incremental backup created successfully',
      backup: result
    });

  } catch (error) {
    logger.error('Manual incremental backup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Incremental backup creation failed',
      error: error.message
    });
  }
});

/**
 * Get list of available backups
 */
router.get('/list', (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/list`);
  console.log('GET params:', req.params);
  console.log('GET query:', req.query);

  try {
    const backups = backupService.getAvailableBackups();
    const stats = backupService.getBackupStats();
    
    res.json({
      success: true,
      backups: backups,
      stats: stats,
      total: backups.length
    });

  } catch (error) {
    logger.error('Failed to get backup list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backup list',
      error: error.message
    });
  }
});

/**
 * Get backup statistics
 */
router.get('/stats', (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/stats`);
  console.log('GET params:', req.params);
  console.log('GET query:', req.query);

  try {
    const stats = backupService.getBackupStats();
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    logger.error('Failed to get backup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backup statistics',
      error: error.message
    });
  }
});

/**
 * Restore from backup (DANGEROUS - requires confirmation)
 */
router.post('/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { confirmation } = req.body;

    if (confirmation !== 'I_UNDERSTAND_THIS_WILL_REPLACE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Set confirmation to: I_UNDERSTAND_THIS_WILL_REPLACE_ALL_DATA'
      });
    }

    logger.warn(`⚠️ DATABASE RESTORE initiated by user: ${req.user.email}, backup: ${filename}`);
    
    const result = await backupService.restoreFromBackup(filename);
    
    logger.warn(`✅ DATABASE RESTORE completed by user: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Database restored successfully',
      result: result
    });

  } catch (error) {
    logger.error('Database restore failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database restore failed',
      error: error.message
    });
  }
});

/**
 * Download backup file
 */
router.get('/download/:filename', (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/download/:filename`);
  console.log('GET params:', req.params);
  console.log('GET query:', req.query);

  try {
    const { filename } = req.params;
    const filePath = path.join(backupService.getBackupDir(), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    logger.info(`Backup download: ${filename} by user: ${req.user.email}`);

    res.download(filePath, filename, (err) => {
      if (err) {
        logger.error('Download failed:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Download failed'
          });
        }
      }
    });

  } catch (error) {
    logger.error('Download preparation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Download preparation failed',
      error: error.message
    });
  }
});

/**
 * Delete backup file
 */
router.delete('/:filename', (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/:filename`);
  console.log('DELETE params:', req.params);

  try {
    const { filename } = req.params;
    const filePath = path.join(backupService.getBackupDir(), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    fs.unlinkSync(filePath);
    
    logger.info(`Backup deleted: ${filename} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Backup file deleted successfully'
    });

  } catch (error) {
    logger.error('Backup deletion failed:', error);
    res.status(500).json({
      success: false,
      message: 'Backup deletion failed',
      error: error.message
    });
  }
});

/**
 * Manual cleanup of old backups
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    logger.info(`Manual backup cleanup initiated by user: ${req.user.email}, keeping ${daysToKeep} days`);
    
    await backupService.cleanupOldBackups(daysToKeep);
    
    res.json({
      success: true,
      message: `Backup cleanup completed, kept last ${daysToKeep} days`
    });

  } catch (error) {
    logger.error('Manual backup cleanup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Backup cleanup failed',
      error: error.message
    });
  }
});

module.exports = router;
