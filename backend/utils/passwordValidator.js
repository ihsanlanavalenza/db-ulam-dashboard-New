// backend/utils/passwordValidator.js

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter khusus (!@#$%^&* dll)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get password strength score
 * @param {string} password 
 * @returns {number} - Score from 0-5
 */
const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) strength++;
  
  return strength;
};

module.exports = {
  validatePasswordStrength,
  getPasswordStrength
};
