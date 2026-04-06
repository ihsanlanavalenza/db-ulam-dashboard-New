// backend/controllers/export.controller.js
const db = require('../config/db');
const { buildWhereClause } = require('../utils/filterHelper');

/**
 * Export data from Summary_Realtime_ULaMM table
 */

/**
 * Export data from Summary_Realtime_ULaMM table
 */
const exportRealtime = async (req, res) => {
  try {
    const { whereClause, params } = buildWhereClause(req);
    
    const query = `
      SELECT *
      FROM Summary_Realtime_ULaMM 
      ${whereClause}
      ORDER BY STR_TO_DATE(Periode, "%d/%m/%Y %H:%i:%s") DESC
    `;
    
    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error exporting realtime:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export data from For Grafik Live ULaMM table
 */
const exportGrafikLive = async (req, res) => {
  try {
    const { whereClause, params } = buildWhereClause(req);
    
    const query = `
      SELECT *
      FROM \`For Grafik Live ULaMM\`
      ${whereClause}
      ORDER BY STR_TO_DATE(TGL_TARIK, "%d/%m/%Y %H:%i:%s") DESC
    `;
    
    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error exporting grafik live:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  exportRealtime,
  exportGrafikLive
};
