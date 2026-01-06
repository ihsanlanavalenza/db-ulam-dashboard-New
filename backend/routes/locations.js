const express = require('express');
const router = express.Router();
const db = require('../config/db'); // koneksi ke database

router.get('/locations', async (req, res) => {
  const { cabang, unit } = req.query;
  try {
    let query = `SELECT LATITUDE, LONGITUDE, NAMA_UNIT FROM Master_Data_Branch_New WHERE 1=1`;
    const params = [];

    if (cabang) {
      query += ` AND NAMA_CABANG = ?`;
      params.push(cabang);
    }

    if (unit) {
      query += ` AND NAMA_UNIT = ?`;
      params.push(unit);
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
