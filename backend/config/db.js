// ==========================================================
// Database Configuration - MySQL Connection Pool
// ==========================================================
require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mini_crm',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Use promise wrapper for async/await support
const promisePool = pool.promise();

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Please check your backend/.env or Railway environment variables and ensure MySQL is reachable.');
    process.exit(1);
  } else {
    console.log('✅ MySQL connected successfully.');
    connection.release();
  }
});

module.exports = promisePool;
