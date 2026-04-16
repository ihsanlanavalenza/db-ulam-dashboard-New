// backend/utils/jwtHelper.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const configuredJwtSecret = (process.env.JWT_SECRET || '').trim();
const fallbackJwtSecret = crypto
  .createHash('sha256')
  .update(`dashboard-mbu|${process.env.DB_HOST || 'localhost'}|${process.env.DB_NAME || 'db_ulaam'}|${process.env.PORT || '3001'}`)
  .digest('hex');

if (!configuredJwtSecret) {
  console.warn('[SECURITY WARNING] JWT_SECRET is not set. Using fallback secret. Set JWT_SECRET in cPanel environment variables immediately.');
}

const JWT_SECRET = configuredJwtSecret || fallbackJwtSecret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    level: user.level,
    cabang_id: user.cabang_id,
    unit_id: user.unit_id
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};
