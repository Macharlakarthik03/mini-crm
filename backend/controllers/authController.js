// ==========================================================
// Auth Controller - Handles admin login
// ==========================================================
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Auth login request:', { username: username || null });

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const admin = await AdminModel.findByUsername(username.trim());
    console.log('Auth login fetched admin:', { found: Boolean(admin), username: admin ? admin.username : null });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (err) {
    console.error('Login error:', err);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

// Verify token is still valid (used by frontend on page load)
exports.verify = (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin
  });
};
