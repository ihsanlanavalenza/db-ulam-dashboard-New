require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'db_ulaam',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('DB Connection Failed:', err);
  } else {
    console.log('Connected to MySQL Database');
    connection.release(); // lepas koneksi setelah tes
  }
});

module.exports = db;
