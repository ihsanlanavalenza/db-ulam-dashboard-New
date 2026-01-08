// backend/middleware/validation.js
const { query, validationResult } = require('express-validator');

/**
 * Validation rules untuk query parameters umum
 */
const validateQueryParams = [
  query('cabang')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Cabang harus berupa string maksimal 100 karakter'),
  
  query('unit')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Unit harus berupa string maksimal 100 karakter'),
  
  query('bulan')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 20 })
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Bulan harus berupa alphanumeric'),
  
  query('tahun')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Tahun harus berupa integer antara 2000-2100'),
];

/**
 * Middleware untuk handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Sanitize string input untuk prevent SQL injection
 */
const sanitizeInput = (input) => {
  if (!input) return null;
  
  // Remove dangerous characters
  return input
    .toString()
    .trim()
    .replace(/['";\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/--/g, '') // Remove SQL comment markers
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .substring(0, 100); // Limit length
};

module.exports = {
  validateQueryParams,
  handleValidationErrors,
  sanitizeInput
};
