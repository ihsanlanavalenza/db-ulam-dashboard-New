// backend/utils/filterHelper.js
const { escapeLikeWildcards } = require('./sanitize');

/**
 * Build WHERE clause and parameters based on user level and query params
 * @param {Object} req - Express request object
 * @param {Object} options - Options for table name mapping
 * @returns {Object} - { whereClause, params }
 */
const buildWhereClause = (req, options = {}) => {
  const whereClauses = [];
  const params = [];
  
  // Get user's data filter from auth middleware
  const userFilter = req.dataFilter || {};
  
  // Table-specific column names (defaults)
  const cabangColumn = options.cabangColumn || 'Cabang';
  const unitColumn = options.unitColumn || 'NamaUnit';
  
  // Apply user-level filters (from auth middleware)
  if (userFilter.unit_id) {
    // Unit level: filter by specific unit
    whereClauses.push(`LOWER(${unitColumn}) LIKE ?`);
    params.push(`%${escapeLikeWildcards(userFilter.unit_id.toLowerCase())}%`);
  } else if (userFilter.cabang_id) {
    // Cabang level: filter by specific cabang
    whereClauses.push(`LOWER(${cabangColumn}) LIKE ?`);
    params.push(`%${escapeLikeWildcards(userFilter.cabang_id.toLowerCase())}%`);
  }
  // Pusat level: no filter (can see all data)
  
  // Apply additional filters from query parameters (if allowed)
  const { cabang, unit } = req.query;
  
  // Only apply query filters if user has permission
  // Unit users cannot filter further (already locked to their unit)
  if (!userFilter.unit_id) {
    if (unit) {
      whereClauses.push(`LOWER(${unitColumn}) LIKE ?`);
      params.push(`%${escapeLikeWildcards(unit.toLowerCase())}%`);
    } else if (cabang && !userFilter.cabang_id) {
      // Only allow cabang filter if not already filtered by user level
      whereClauses.push(`LOWER(${cabangColumn}) LIKE ?`);
      params.push(`%${escapeLikeWildcards(cabang.toLowerCase())}%`);
    }
  }
  
  const whereClause = whereClauses.length > 0 
    ? `WHERE ${whereClauses.join(' AND ')}` 
    : '';
  
  return { whereClause, params };
};

/**
 * Build filter for Master_Data_Branch_New table (has different column names)
 * @param {Object} req - Express request object
 * @returns {Object} - { whereClause, params }
 */
const buildBranchWhereClause = (req) => {
  return buildWhereClause(req, {
    cabangColumn: 'NAMA_CABANG',
    unitColumn: 'NAMA_UNIT'
  });
};

/**
 * Get filtered cabang and unit lists based on user level
 * @param {Object} req - Express request object
 * @returns {Object} - { cabangFilter, unitFilter }
 */
const getUserLevelFilters = (req) => {
  const userFilter = req.dataFilter || {};
  
  let cabangFilter = '';
  let unitFilter = '';
  const params = [];
  
  if (userFilter.unit_id) {
    // Unit level: only show their unit (and their cabang for cabang dropdown)
    cabangFilter = 'WHERE LOWER(NAMA_CABANG) LIKE ?';
    unitFilter = 'WHERE LOWER(NAMA_UNIT) LIKE ?';
    params.push(`%${escapeLikeWildcards(userFilter.cabang_id.toLowerCase())}%`);
    params.push(`%${escapeLikeWildcards(userFilter.unit_id.toLowerCase())}%`);
  } else if (userFilter.cabang_id) {
    // Cabang level: only show units in their cabang
    cabangFilter = 'WHERE LOWER(NAMA_CABANG) LIKE ?';
    unitFilter = 'WHERE LOWER(NAMA_CABANG) LIKE ?';
    params.push(`%${escapeLikeWildcards(userFilter.cabang_id.toLowerCase())}%`);
    params.push(`%${escapeLikeWildcards(userFilter.cabang_id.toLowerCase())}%`);
  }
  // Pusat level: no filter
  
  return { cabangFilter, unitFilter, params };
};

module.exports = {
  buildWhereClause,
  buildBranchWhereClause,
  getUserLevelFilters
};
