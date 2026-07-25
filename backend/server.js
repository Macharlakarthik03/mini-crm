// ==========================================================
// Mini CRM - Server Entry Point
// ==========================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
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
// Print runtime dirs so deploy logs show where the process is running from
console.log('Mini CRM: __dirname =', __dirname);
console.log('Mini CRM: process.cwd() =', process.cwd());

// Search strategy: look for a directory named "frontend" by checking
// parent directories of both __dirname and process.cwd(), then a small
// bounded recursive search. Do NOT fall back to an absolute "/frontend".
function findFrontendDir() {
  const starts = [__dirname, process.cwd()];

  // If a `public` folder exists inside backend, prefer it (we copy frontend there for deployments)
  try {
    const publicCandidate = path.join(__dirname, 'public');
    console.log('Mini CRM: checking candidate path:', publicCandidate);
    if (fs.existsSync(publicCandidate) && fs.statSync(publicCandidate).isDirectory()) {
      return publicCandidate;
    }
  } catch (e) {
    // ignore
  }

  // Walk up from each start dir a few levels and check for a sibling "frontend"
  for (const start of starts) {
    let dir = path.resolve(start);
    for (let i = 0; i < 6; i++) {
      if (!dir) break;
      const candidate = path.join(dir, 'frontend');
      console.log('Mini CRM: checking candidate path:', candidate);
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          return candidate;
        }
      } catch (e) {
        // ignore and continue
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  // Bounded recursive search to catch frontends inside nearby folders (depth 2)
  function findInside(start, depth) {
    if (depth < 0) return null;
    let entries;
    try { entries = fs.readdirSync(start, { withFileTypes: true }); } catch (e) { return null; }
    for (const e of entries) {
      if (e.isDirectory() && e.name === 'frontend') {
        const p = path.join(start, e.name);
        console.log('Mini CRM: found frontend at (recursive):', p);
        return p;
      }
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const sub = path.join(start, e.name);
      const res = findInside(sub, depth - 1);
      if (res) return res;
    }
    return null;
  }

  const rootsToSearch = [process.cwd(), path.resolve(__dirname, '..'), path.resolve(process.cwd(), '..')];
  for (const r of rootsToSearch) {
    console.log('Mini CRM: recursive search starting at:', r);
    const res = findInside(r, 2);
    if (res) return res;
  }

  return null;
}

const frontendPath = findFrontendDir();
if (!frontendPath) {
  console.error('Mini CRM: ERROR - frontend directory not found. Checked __dirname and process.cwd() parent paths and performed bounded recursive search.');
  console.error('Mini CRM: Please ensure the `frontend` folder is present in the repository and that Railway Root Directory setting (backend) is correct.');
  // Fail fast so deployment shows an explicit error instead of ENOENT later
  process.exit(1);
}

console.log('Mini CRM: serving frontend from', frontendPath);
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
