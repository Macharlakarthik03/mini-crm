// ==========================================================
// Mini CRM - Server Entry Point
// ==========================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Serve Frontend (static files) ----------
const frontendPath = path.resolve(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ---------- API Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Mini CRM API is running.' });
});

// ---------- Fallback: send index.html for any non-API route ----------
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found.' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ---------- Global Error Handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mini CRM server running at http://localhost:${PORT}`);
});
