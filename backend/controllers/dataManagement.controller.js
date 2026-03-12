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

function formatPeriode(dateStr) {
  const [date, time] = dateStr.split(" ");
  const [day, month, year] = date.split("/");

  return `${year}-${month}-${day} ${time}`;
}

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
    
    const formattedPeriode = formatPeriode(periode);

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
    
    // Insert data
    const query = `
      INSERT INTO summarymonthly 
      (Periode, Cabang, NamaUnit, NOA, NoaPar, NoaNpl, Noa_LAR, OS, OSPar, OSNPL, OS_LAR)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.promise().query(query, [
      formattedPeriode,
      sanitizeInput(cabang),
      sanitizeInput(namaUnit),
      noa || 0,
      noaPar || 0,
      noaNpl || 0,
      noaLar || 0,
      os || 0,
      osPar || 0,
      osNpl || 0,
      osLar || 0
    ]);
    
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
    
    // Check if record exists
    const [existing] = await db.promise().query(
      'SELECT * FROM summarymonthly WHERE Periode = ? AND Cabang = ? AND NamaUnit = ? LIMIT 1',
      [id.split('|')[0], id.split('|')[1], id.split('|')[2]]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan'
      });
    }
    
    // Check user permissions
    const userFilter = req.dataFilter || {};
    if (userFilter.unit_id && existing[0].NamaUnit !== userFilter.unit_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus data ini'
      });
    }
    
    await db.promise().query(
      'DELETE FROM summarymonthly WHERE Periode = ? AND Cabang = ? AND NamaUnit = ?',
      [id.split('|')[0], id.split('|')[1], id.split('|')[2]]
    );
    
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
