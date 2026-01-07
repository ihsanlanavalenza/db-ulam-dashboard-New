// backend/utils/sanitize.js
/**
 * Sanitize user input to prevent SQL injection and XSS
 */

/**
 * Escape SQL LIKE wildcards to prevent SQL injection
 * @param {string} value - The value to escape
 * @returns {string} - Escaped value
 */
const escapeLikeWildcards = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\\/g, '\\\\')  // Escape backslash
    .replace(/%/g, '\\%')    // Escape percent
    .replace(/_/g, '\\_')    // Escape underscore
    .replace(/\[/g, '\\[');  // Escape bracket
};

/**
 * Sanitize string input - remove dangerous characters
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize alphanumeric input (for IDs, usernames)
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeAlphanumeric = (input) => {
  if (typeof input !== 'string') return input;
  
  // Only allow alphanumeric, underscore, and hyphen
  return input.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Sanitize email
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  
  // Convert to lowercase and trim
  return email.toLowerCase().trim();
};

/**
 * Validate and sanitize integer
 * @param {any} value - Value to sanitize
 * @returns {number|null} - Sanitized integer or null
 */
const sanitizeInteger = (value) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

/**
 * General input sanitization - applies appropriate sanitization based on context
 * @param {any} input - The input to sanitize
 * @param {string} type - Type of sanitization ('string', 'alphanumeric', 'email', 'integer')
 * @returns {any} - Sanitized input
 */
const sanitizeInput = (input, type = 'string') => {
  if (input === null || input === undefined) return input;
  
  switch (type) {
    case 'alphanumeric':
      return sanitizeAlphanumeric(input);
    case 'email':
      return sanitizeEmail(input);
    case 'integer':
      return sanitizeInteger(input);
    case 'string':
    default:
      return sanitizeString(input);
  }
};

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeAlphanumeric,
  sanitizeEmail,
  sanitizeInteger,
  escapeLikeWildcards
};
