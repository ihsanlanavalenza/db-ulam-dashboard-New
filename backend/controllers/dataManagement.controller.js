// backend/controllers/dataManagement.controller.js
const db = require('../config/db');
const { sanitizeInput } = require('../utils/sanitize');

/**
 * Get data transactions with pagination
 */
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, cabang, unit, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    
    // Apply filters
    if (cabang && cabang !== 'All') {
      whereConditions.push('Cabang = ?');
      params.push(cabang);
    }
    
    if (unit && unit !== 'All') {
      whereConditions.push('NamaUnit = ?');
      params.push(unit);
    }
    
    if (startDate) {
      whereConditions.push('STR_TO_DATE(Periode, "%d/%m/%Y %H:%i:%s") >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('STR_TO_DATE(Periode, "%d/%m/%Y %H:%i:%s") <= ?');
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM summarymonthly ${whereClause}`;
    const [countResult] = await db.promise().query(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated data
    const dataQuery = `
      SELECT 
        Periode,
        Cabang,
        NamaUnit,
        NOA,
        NoaPar,
        NoaNpl,
        Noa_LAR,
        OS,
        OSPar,
        OSNPL,
        OS_LAR
      FROM summarymonthly 
      ${whereClause}
      ORDER BY STR_TO_DATE(Periode, "%d/%m/%Y %H:%i:%s") DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.promise().query(dataQuery, params);
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create new transaction
 */
const createTransaction = async (req, res) => {
  try {
    const {
      periode,
      cabang,
      namaUnit,
      noa,
      noaPar,
      noaNpl,
      noaLar,
      os,
      osPar,
      osNpl,
      osLar
    } = req.body;
    
    // Validate required fields
    if (!periode || !cabang || !namaUnit) {
      return res.status(400).json({
        success: false,
        message: 'Periode, Cabang, dan Nama Unit harus diisi'
      });
    }

    // Check user permissions
    const userFilter = req.dataFilter || {};
    if (userFilter.unit_id && namaUnit !== userFilter.unit_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda hanya dapat menambah data untuk unit Anda sendiri'
      });
    }
    
    if (userFilter.cabang_id && cabang !== userFilter.cabang_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda hanya dapat menambah data untuk cabang Anda sendiri'
      });
    }
    
    // Step 1: Get actual table columns to avoid column count mismatch
    const [columns] = await db.promise().query('SHOW COLUMNS FROM summarymonthly');
    const columnNames = columns.map(col => col.Field);
    
    // Map form fields to potential column names (case-insensitive matching)
    const fieldMapping = {
      'Periode': periode,
      'periode': periode,
      'Cabang': sanitizeInput(cabang),
      'cabang': sanitizeInput(cabang),
      'NamaUnit': sanitizeInput(namaUnit),
      'namaunit': sanitizeInput(namaUnit),
      'Nama_Unit': sanitizeInput(namaUnit),
      'NOA': noa || 0,
      'noa': noa || 0,
      'NoaPar': noaPar || 0,
      'NoaPAR': noaPar || 0,
      'noapar': noaPar || 0,
      'NoaNpl': noaNpl || 0,
      'NoaNPL': noaNpl || 0,
      'noanpl': noaNpl || 0,
      'Noa_LAR': noaLar || 0,
      'noa_lar': noaLar || 0,
      'NoaLAR': noaLar || 0,
      'OS': os || 0,
      'os': os || 0,
      'OSPar': osPar || 0,
      'OsPar': osPar || 0,
      'ospar': osPar || 0,
      'OSNPL': osNpl || 0,
      'OsNPL': osNpl || 0,
      'osnpl': osNpl || 0,
      'OS_LAR': osLar || 0,
      'os_lar': osLar || 0,
      'OsLAR': osLar || 0,
    };
    
    // Build INSERT dynamically based on actual table columns
    const insertColumns = [];
    const insertValues = [];
    
    for (const colName of columnNames) {
      if (fieldMapping.hasOwnProperty(colName)) {
        insertColumns.push(colName);
        insertValues.push(fieldMapping[colName]);
      }
    }
    
    if (insertColumns.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Tidak dapat mencocokkan kolom tabel. Hubungi administrator.'
      });
    }
    
    const placeholders = insertColumns.map(() => '?').join(', ');
    const query = `INSERT INTO summarymonthly (${insertColumns.join(', ')}) VALUES (${placeholders})`;
    
    console.log('INSERT columns:', insertColumns);
    console.log('INSERT values count:', insertValues.length);
    
    await db.promise().query(query, insertValues);
    
    res.json({
      success: true,
      message: 'Data berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete transaction
 */
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Decode the composite key (Periode|Cabang|NamaUnit)
    const decodedId = decodeURIComponent(id);
    const parts = decodedId.split('|');
    
    if (parts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Format ID tidak valid'
      });
    }
    
    const periode = parts[0];
    const cabang = parts[1];
    const namaUnit = parts.length >= 3 ? parts[2] : null;
    
    console.log('DELETE request - Periode:', periode, 'Cabang:', cabang, 'NamaUnit:', namaUnit);
    
    // Detect the actual NamaUnit column name in the table
    const [columns] = await db.promise().query('SHOW COLUMNS FROM summarymonthly');
    const columnNames = columns.map(col => col.Field);
    
    // Find the right column name for NamaUnit (could be NamaUnit, namaunit, Nama_Unit, etc.)
    const unitColumnCandidates = ['NamaUnit', 'namaunit', 'Nama_Unit', 'nama_unit'];
    const unitColumn = columnNames.find(col => unitColumnCandidates.includes(col)) || 'NamaUnit';
    
    // Find the right column name for Cabang
    const cabangColumnCandidates = ['Cabang', 'cabang'];
    const cabangColumn = columnNames.find(col => cabangColumnCandidates.includes(col)) || 'Cabang';
    
    // Find the right column name for Periode
    const periodeColumnCandidates = ['Periode', 'periode'];
    const periodeColumn = columnNames.find(col => periodeColumnCandidates.includes(col)) || 'Periode';
    
    // Build WHERE clause handling null/empty NamaUnit
    let selectQuery, deleteQuery, queryParams;
    
    if (!namaUnit || namaUnit === 'null' || namaUnit === 'undefined' || namaUnit === '') {
      // NamaUnit is null/empty - match rows where NamaUnit IS NULL or empty
      selectQuery = `SELECT * FROM summarymonthly WHERE ${periodeColumn} = ? AND ${cabangColumn} = ? AND (${unitColumn} IS NULL OR TRIM(${unitColumn}) = '') LIMIT 1`;
      deleteQuery = `DELETE FROM summarymonthly WHERE ${periodeColumn} = ? AND ${cabangColumn} = ? AND (${unitColumn} IS NULL OR TRIM(${unitColumn}) = '')`;
      queryParams = [periode, cabang];
    } else {
      // NamaUnit has a value - match exactly
      selectQuery = `SELECT * FROM summarymonthly WHERE ${periodeColumn} = ? AND ${cabangColumn} = ? AND ${unitColumn} = ? LIMIT 1`;
      deleteQuery = `DELETE FROM summarymonthly WHERE ${periodeColumn} = ? AND ${cabangColumn} = ? AND ${unitColumn} = ?`;
      queryParams = [periode, cabang, namaUnit];
    }
    
    console.log('SELECT query:', selectQuery);
    console.log('Query params:', queryParams);
    
    // Check if record exists
    const [existing] = await db.promise().query(selectQuery, queryParams);
    
    if (existing.length === 0) {
      // Try alternative: maybe the Periode format is different in the DB
      // Try matching with LIKE for Periode (handles format differences)
      let altSelectQuery;
      let altParams;
      
      if (!namaUnit || namaUnit === 'null' || namaUnit === 'undefined' || namaUnit === '') {
        altSelectQuery = `SELECT * FROM summarymonthly WHERE TRIM(${periodeColumn}) LIKE ? AND TRIM(${cabangColumn}) = TRIM(?) AND (${unitColumn} IS NULL OR TRIM(${unitColumn}) = '') LIMIT 1`;
        altParams = [`%${periode.trim()}%`, cabang.trim()];
      } else {
        altSelectQuery = `SELECT * FROM summarymonthly WHERE TRIM(${periodeColumn}) LIKE ? AND TRIM(${cabangColumn}) = TRIM(?) AND TRIM(${unitColumn}) = TRIM(?) LIMIT 1`;
        altParams = [`%${periode.trim()}%`, cabang.trim(), namaUnit.trim()];
      }
      
      console.log('Trying alternative SELECT:', altSelectQuery);
      const [altExisting] = await db.promise().query(altSelectQuery, altParams);
      
      if (altExisting.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data tidak ditemukan'
        });
      }
      
      // Found with alternative query - use the actual stored values for precise delete
      const foundRow = altExisting[0];
      const actualPeriode = foundRow[periodeColumn];
      const actualCabang = foundRow[cabangColumn];
      const actualUnit = foundRow[unitColumn];
      
      // Check user permissions
      const userFilter = req.dataFilter || {};
      if (userFilter.unit_id && actualUnit !== userFilter.unit_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses untuk menghapus data ini'
        });
      }
      
      if (actualUnit) {
        await db.promise().query(
          `DELETE FROM summarymonthly WHERE ${periodeColumn} = ? AND ${cabangColumn} = ? AND ${unitColumn} = ?`,
          [actualPeriode, actualCabang, actualUnit]
        );
      } else {
        await db.promise().query(
          `DELETE FROM summarymonthly WHERE ${periodeColumn} = ? AND ${cabangColumn} = ? AND (${unitColumn} IS NULL OR TRIM(${unitColumn}) = '')`,
          [actualPeriode, actualCabang]
        );
      }
      
      return res.json({
        success: true,
        message: 'Data berhasil dihapus'
      });
    }
    
    // Check user permissions
    const userFilter = req.dataFilter || {};
    const existingUnit = existing[0][unitColumn] || existing[0].NamaUnit || existing[0].namaunit;
    if (userFilter.unit_id && existingUnit !== userFilter.unit_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus data ini'
      });
    }
    
    await db.promise().query(deleteQuery, queryParams);
    
    res.json({
      success: true,
      message: 'Data berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction
};
