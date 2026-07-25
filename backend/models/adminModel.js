// ==========================================================
// Admin Model - Database queries for admins table
// ==========================================================
const db = require('../config/db');

const AdminModel = {
  async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0];
  }
};

module.exports = AdminModel;
