// ==========================================================
// Database Configuration - MySQL Connection Pool
// ==========================================================
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2');

console.log('MySQL config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});
console.log('JWT_SECRET present:', Boolean(process.env.JWT_SECRET));

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
