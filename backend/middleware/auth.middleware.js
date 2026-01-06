// backend/middleware/auth.middleware.js
const { verifyToken } = require('../utils/jwtHelper');
const db = require('../config/db');
const crypto = require('crypto');

/**
 * Middleware to require authentication
 */
const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau telah kadaluarsa'
      });
    }

    // Check if session exists in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const [sessions] = await db.promise().query(
      'SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesi tidak valid atau telah berakhir'
      });
    }

    // Check if user is still active
    const [users] = await db.promise().query(
      'SELECT id, username, email, role, level, cabang_id, unit_id, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'User tidak aktif atau tidak ditemukan'
      });
    }

    // Attach user info to request
    req.user = users[0];
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to require specific role(s)
 * Usage: requireRole(['admin']) or requireRole(['admin', 'user'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini'
      });
    }

    next();
  };
};

/**
 * Middleware to require specific level(s)
 * Usage: requireLevel(['pusat']) or requireLevel(['pusat', 'cabang'])
 */
const requireLevel = (allowedLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedLevels.includes(req.user.level)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Level akses Anda tidak mencukupi'
      });
    }

    next();
  };
};

/**
 * Middleware to filter data based on user level
 * Adds SQL WHERE conditions based on user's organizational level
 */
const applyDataFilter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Initialize filter object
  req.dataFilter = {};

  // Apply filters based on user level
  switch (req.user.level) {
    case 'unit':
      // Unit level: can only see their own unit data
      if (req.user.unit_id) {
        req.dataFilter.unit_id = req.user.unit_id;
        req.dataFilter.cabang_id = req.user.cabang_id;
      }
      break;

    case 'cabang':
      // Cabang level: can see all units in their cabang
      if (req.user.cabang_id) {
        req.dataFilter.cabang_id = req.user.cabang_id;
      }
      break;

    case 'pusat':
      // Pusat level: can see all data (no filter)
      break;

    default:
      return res.status(403).json({
        success: false,
        message: 'Level akses tidak valid'
      });
  }

  next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireLevel,
  applyDataFilter
};
