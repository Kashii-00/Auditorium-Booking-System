const express = require('express');
const router = express.Router();
const moment = require('moment');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../auth');
const bcrypt = require('bcrypt');

// Input validation helper function
const validateUserId = (userId) => {
  // Only allow positive integers
  const num = parseInt(userId);
  return !isNaN(num) && num > 0 && num.toString() === userId.toString();
};

// Sanitize and validate search parameters
const sanitizeSearchParams = (params) => {
  const allowedFields = ['name', 'email', 'role', 'status'];
  const sanitized = {};
  
  for (const [key, value] of Object.entries(params)) {
    // Skip 'id' parameter as it should only be used in route parameters
    if (key === 'id') {
      continue;
    }
    
    if (allowedFields.includes(key) && typeof value === 'string' && value.trim()) {
      // Remove any SQL injection attempts
      const sanitizedValue = value.trim().replace(/[;'"\\]/g, '');
      if (sanitizedValue.length > 0 && sanitizedValue.length <= 255) {
        sanitized[key] = sanitizedValue;
      }
    }
  }
  
  return sanitized;
};

router.get('/', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/users`);
  console.log('Query parameters:', req.query);
  
  try {
    // Check for suspicious query parameters that might indicate SQL injection attempts
    const suspiciousParams = ['id', 'union', 'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'exec', 'execute'];
    const hasSuspiciousParams = Object.keys(req.query).some(param => 
      suspiciousParams.some(suspicious => param.toLowerCase().includes(suspicious))
    );
    
    if (hasSuspiciousParams) {
      logger.warn(`Potential SQL injection attempt detected in query parameters: ${JSON.stringify(req.query)}`);
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
    
    // Sanitize and validate query parameters
    const searchParams = sanitizeSearchParams(req.query);
    
    let sql = 'SELECT id, name, email, phone, role, status FROM users';
    const values = [];
    const conditions = [];
    
    // Build WHERE clause with parameterized queries
    if (searchParams.name) {
      conditions.push('name LIKE ?');
      values.push(`%${searchParams.name}%`);
    }
    
    if (searchParams.email) {
      conditions.push('email LIKE ?');
      values.push(`%${searchParams.email}%`);
    }
    
    if (searchParams.role) {
      conditions.push('role LIKE ?');
      values.push(`%${searchParams.role}%`);
    }
    
    if (searchParams.status) {
      conditions.push('status = ?');
      values.push(searchParams.status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY name ASC';
    
    console.log('Executing SQL:', sql);
    console.log('With values:', values);
    
    db.query(sql, values, (err, results) => {
      if (err) {
        logger.error('Database error in GET /api/users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json(results);
    });
  } catch (error) {
    logger.error('Error in GET /api/users:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] GET /api/users/${req.params.id}`);
  
  try {
    const userId = req.params.id;
    
    // Validate user ID to prevent SQL injection
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const sql = 'SELECT id, name, email, phone, role, status FROM users WHERE id = ?';
    
    console.log('Executing SQL:', sql);
    console.log('With userId:', userId);
    
    db.query(sql, [userId], (err, results) => {
      if (err) {
        logger.error('Database error in GET /api/users/:id:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(results[0]);
    });
  } catch (error) {
    logger.error('Error in GET /api/users/:id:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] POST /api/users`);
  console.log('User creation POST body:', req.body);

  try {
    const user_name = req.user.name;
    const { name, email, phone, password, role } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Note: XSS protection is now handled by middleware
    // Basic sanitization for consistency
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPhone = phone ? phone.trim() : null;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const roleArray = Array.isArray(role) ? role : [role];
    const roleJson = JSON.stringify(roleArray);

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
    
    console.log('Executing SQL:', sql);
    console.log('With values:', [sanitizedName, sanitizedEmail, sanitizedPhone, '[HASHED]', roleJson]);
    
    db.query(sql, [sanitizedName, sanitizedEmail, sanitizedPhone, hashedPassword, roleJson], (err, result) => {
      if (err) {
        logger.error('Database error in POST /api/users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User Created Successfully at: ${logintime} by: ${user_name}`);
      return res.json({ success: true, message: 'User created successfully' });
    });
  } catch (err) { 
    logger.error('Error in POST /api/users:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth.authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] PUT /api/users/${req.params.id}`);
  console.log('User update PUT body:', req.body);

  try {
    const userId = req.params.id;
    const user_name = req.user.name;
    const { name, email, phone, password, role, status } = req.body;

    // Validate user ID
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const updates = [];
    const values = [];

    if (name) {
      const sanitizedName = name.trim().replace(/[<>]/g, '');
      if (sanitizedName.length > 0) {
        updates.push('name = ?');
        values.push(sanitizedName);
      }
    }
    
    if (email) {
      const sanitizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(sanitizedEmail)) {
        updates.push('email = ?');
        values.push(sanitizedEmail);
      } else {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    if (phone) {
      const sanitizedPhone = phone.trim().replace(/[^0-9+\-\s()]/g, '');
      if (sanitizedPhone.length > 0) {
        updates.push('phone = ?');
        values.push(sanitizedPhone);
      }
    }
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      } catch (err) {
        logger.error('Password hashing error:', err);
        return res.status(500).json({ error: 'Password hashing failed' });
      }
    }
    
    if (role) {
      updates.push('role = ?');
      const roleArray = Array.isArray(role) ? role : [role];
      values.push(JSON.stringify(roleArray));
    }
    
    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (validStatuses.includes(status.toLowerCase())) {
        updates.push('status = ?');
        values.push(status.toLowerCase());
      } else {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    values.push(userId);

    console.log('Executing SQL:', sql);
    console.log('With values:', values.map(v => typeof v === 'string' && v.length > 20 ? '[LONG_STRING]' : v));

    db.query(sql, values, (err, result) => {
      if (err) {
        logger.error('Database error in PUT /api/users/:id:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User ${userId} Updated Successfully at: ${logintime} by: ${user_name}`);
      return res.json({ success: true, message: 'User updated successfully' });
    });
  } catch (error) {
    logger.error('Error in PUT /api/users/:id:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth.authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] DELETE /api/users/${req.params.id}`);
  
  try {
    const userIdToDelete = req.params.id;
    const loggedInUserId = req.user.id;
    const user_name = req.user.name;

    // Validate user ID
    if (!validateUserId(userIdToDelete)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    if (String(userIdToDelete) === String(loggedInUserId)) {
      return res.status(403).json({ error: 'You cannot delete your own account.' });
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    
    console.log('Executing SQL:', sql);
    console.log('With userId:', userIdToDelete);
    
    db.query(sql, [userIdToDelete], (err, result) => {
      if (err) {
        logger.error('Database error in DELETE /api/users/:id:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const logintime = moment().format('YYYY-MM-DD HH:mm:ss');
      logger.info(`User ${userIdToDelete} Deleted Successfully at: ${logintime} by : ${user_name}`);
      return res.json({ success: true, message: 'User deleted' });
    });
  } catch (error) {
    logger.error('Error in DELETE /api/users/:id:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
