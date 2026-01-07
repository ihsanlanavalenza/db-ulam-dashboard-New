// backend/utils/jwtHelper.js
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET must be defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;
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
