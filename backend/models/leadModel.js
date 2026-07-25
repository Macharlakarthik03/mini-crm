// ==========================================================
// Lead Model - Database queries for leads table
// ==========================================================
const db = require('../config/db');

const LeadModel = {
  // Get all leads with optional search, status filter, and sort
  async getAll({ search, status, sort }) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (sort === 'oldest') {
      query += ' ORDER BY created_at ASC';
    } else {
      // default: latest first
      query += ' ORDER BY created_at DESC';
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM leads WHERE id = ?', [id]);
    return rows[0];
  },

  async findByEmail(email, excludeId = null) {
    let query = 'SELECT * FROM leads WHERE email = ?';
    const params = [email];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await db.query(query, params);
    return rows[0];
  },

  async create({ name, email, phone, source, status, notes }) {
    const [result] = await db.query(
      `INSERT INTO leads (name, email, phone, source, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, source, status || 'New', notes || '']
    );
    return this.getById(result.insertId);
  },

  async update(id, { name, email, phone, source, status, notes }) {
    await db.query(
      `UPDATE leads
       SET name = ?, email = ?, phone = ?, source = ?, status = ?, notes = ?
       WHERE id = ?`,
      [name, email, phone, source, status, notes, id]
    );
    return this.getById(id);
  },

  async updateStatus(id, status) {
    await db.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
    return this.getById(id);
  },

  async updateNotes(id, notes) {
    await db.query('UPDATE leads SET notes = ? WHERE id = ?', [notes, id]);
    return this.getById(id);
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM leads WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getStats() {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'New' THEN 1 ELSE 0 END) AS newLeads,
        SUM(CASE WHEN status = 'Contacted' THEN 1 ELSE 0 END) AS contacted,
        SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) AS converted
      FROM leads
    `);
    const stats = rows[0];
    return {
      total: Number(stats.total) || 0,
      newLeads: Number(stats.newLeads) || 0,
      contacted: Number(stats.contacted) || 0,
      converted: Number(stats.converted) || 0
    };
  }
};

module.exports = LeadModel;
