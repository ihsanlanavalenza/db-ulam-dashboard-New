// backend/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtHelper');
const crypto = require('crypto');

/**
 * Login - Authenticate user and return JWT token
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    // Find user by username
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store session in database
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.promise().query(
      'INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, tokenHash, req.ip, req.get('user-agent'), expiresAt]
    );

    // Update last login
    await db.promise().query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Log audit
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN', req.ip, req.get('user-agent')]
    );

    // Return response (exclude password)
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout - Invalidate user session
 */
const logout = async (req, res) => {
  try {
    const user = req.user; // From auth middleware

    // Delete session from database
    const token = req.headers.authorization?.split(' ')[1];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.promise().query(
      'DELETE FROM user_sessions WHERE token_hash = ?',
      [tokenHash]
    );

    // Log audit
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGOUT', req.ip, req.get('user-agent')]
    );

    res.json({
      success: true,
      message: 'Logout berhasil'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify Token - Check if token is valid
 */
const verifyToken = async (req, res) => {
  try {
    const user = req.user; // From auth middleware

    // Get fresh user data
    const [users] = await db.promise().query(
      'SELECT id, username, email, role, level, cabang_id, unit_id, is_active, last_login FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get Current User Profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.promise().query(
      `SELECT 
        id, username, email, role, level, 
        cabang_id, unit_id, is_active, last_login,
        created_at, updated_at
       FROM users 
       WHERE id = ?`,
      [userId]
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  logout,
  verifyToken,
  getProfile
};
