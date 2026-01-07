// backend/controllers/users.controller.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sanitizeInput, sanitizeEmail, sanitizeAlphanumeric } = require('../utils/sanitize');
const { validatePasswordStrength } = require('../utils/passwordValidator');

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT 
        id, username, email, role, level, 
        cabang_id, unit_id, is_active, last_login,
        created_at, updated_at
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get single user by ID (Admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.promise().query(
      `SELECT 
        id, username, email, role, level, 
        cabang_id, unit_id, is_active, last_login,
        created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new user (Admin only)
 */
const createUser = async (req, res) => {
  try {
    // Sanitize inputs
    const username = sanitizeAlphanumeric(req.body.username);
    const email = sanitizeEmail(req.body.email);
    const password = sanitizeInput(req.body.password, 'string');
    const role = sanitizeAlphanumeric(req.body.role);
    const level = sanitizeAlphanumeric(req.body.level);
    const cabang_id = sanitizeAlphanumeric(req.body.cabang_id);
    const unit_id = sanitizeAlphanumeric(req.body.unit_id);

    // Validation
    if (!username || !email || !password || !role || !level) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, role, dan level wajib diisi'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak memenuhi persyaratan',
        errors: passwordValidation.errors
      });
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus admin atau user'
      });
    }

    // Validate level
    if (!['pusat', 'cabang', 'unit'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Level harus pusat, cabang, atau unit'
      });
    }

    // Validate level-specific requirements
    if (level === 'cabang' && !cabang_id) {
      return res.status(400).json({
        success: false,
        message: 'cabang_id wajib diisi untuk level cabang'
      });
    }

    if (level === 'unit' && (!cabang_id || !unit_id)) {
      return res.status(400).json({
        success: false,
        message: 'cabang_id dan unit_id wajib diisi untuk level unit'
      });
    }

    // Check if username exists
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Check if email exists
    const [existingEmails] = await db.promise().query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.promise().query(
      `INSERT INTO users 
        (username, email, password_hash, role, level, cabang_id, unit_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, password_hash, role, level, cabang_id || null, unit_id || null, req.user.id]
    );

    // Log audit
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_USER', JSON.stringify({username, role, level, cabang_id, unit_id}), req.ip, req.get('user-agent')]
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: {
        id: result.insertId,
        username,
        email,
        role,
        level,
        cabang_id: cabang_id || null,
        unit_id: unit_id || null
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sanitize inputs
    const username = req.body.username ? sanitizeAlphanumeric(req.body.username) : null;
    const email = req.body.email ? sanitizeEmail(req.body.email) : null;
    const password = req.body.password ? sanitizeInput(req.body.password, 'string') : null;
    const role = req.body.role ? sanitizeAlphanumeric(req.body.role) : null;
    const level = req.body.level ? sanitizeAlphanumeric(req.body.level) : null;
    const cabang_id = req.body.cabang_id ? sanitizeAlphanumeric(req.body.cabang_id) : null;
    const unit_id = req.body.unit_id ? sanitizeAlphanumeric(req.body.unit_id) : null;
    const is_active = req.body.is_active !== undefined ? req.body.is_active : null;

    // Check if user exists
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const existingUser = existingUsers[0];
    const updates = [];
    const params = [];

    // Build dynamic update query
    if (username && username !== existingUser.username) {
      // Check if new username exists
      const [usernameCheck] = await db.promise().query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );

      if (usernameCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }

      updates.push('username = ?');
      params.push(username);
    }

    if (email && email !== existingUser.email) {
      // Check if new email exists
      const [emailCheck] = await db.promise().query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan'
        });
      }

      updates.push('email = ?');
      params.push(email);
    }

    if (password) {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password tidak memenuhi persyaratan',
          errors: passwordValidation.errors
        });
      }
      
      const password_hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(password_hash);
    }

    if (role && ['admin', 'user'].includes(role)) {
      updates.push('role = ?');
      params.push(role);
    }

    if (level && ['pusat', 'cabang', 'unit'].includes(level)) {
      updates.push('level = ?');
      params.push(level);
    }

    if (cabang_id !== undefined) {
      updates.push('cabang_id = ?');
      params.push(cabang_id || null);
    }

    if (unit_id !== undefined) {
      updates.push('unit_id = ?');
      params.push(unit_id || null);
    }

    if (typeof is_active === 'boolean' || is_active === 0 || is_active === 1) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.promise().query(query, params);

    // Log audit
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_USER', 'users', id, JSON.stringify(req.body), req.ip, req.get('user-agent')]
    );

    // Get updated user
    const [updatedUsers] = await db.promise().query(
      `SELECT 
        id, username, email, role, level, 
        cabang_id, unit_id, is_active, last_login,
        created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'User berhasil diupdate',
      data: updatedUsers[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await db.promise().query(
      'SELECT username FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus akun sendiri'
      });
    }

    const username = users[0].username;

    // Delete user sessions first
    await db.promise().query(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [id]
    );

    // Delete user
    await db.promise().query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    // Log audit
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_USER', 'users', id, JSON.stringify({username}), req.ip, req.get('user-agent')]
    );

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Toggle user active status (Admin only)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await db.promise().query(
      'SELECT is_active FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Prevent self-deactivation
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menonaktifkan akun sendiri'
      });
    }

    const newStatus = users[0].is_active ? 0 : 1;

    // Update status
    await db.promise().query(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    // If deactivating, delete their sessions
    if (newStatus === 0) {
      await db.promise().query(
        'DELETE FROM user_sessions WHERE user_id = ?',
        [id]
      );
    }

    // Log audit
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'TOGGLE_USER_STATUS', 'users', id, JSON.stringify({is_active: newStatus}), req.ip, req.get('user-agent')]
    );

    res.json({
      success: true,
      message: `User berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: { is_active: newStatus }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
};
