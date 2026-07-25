// API helper copied into backend/public/js
const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('crm_token'); },
  setToken(token) { localStorage.setItem('crm_token', token); },
  getAdmin() { const raw = localStorage.getItem('crm_admin'); return raw ? JSON.parse(raw) : null; },
  setAdmin(admin) { localStorage.setItem('crm_admin', JSON.stringify(admin)); },
  logout() { localStorage.removeItem('crm_token'); localStorage.removeItem('crm_admin'); window.location.href = 'index.html'; },
  requireAuth() { if (!this.getToken()) { window.location.href = 'index.html'; } }
};

async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = { success: false, message: 'Unexpected server response.' }; }

  if (res.status === 401) { Auth.logout(); return Promise.reject(data); }
  if (!res.ok || data.success === false) return Promise.reject(data);
  return data;
}

function ensureToastContainer() { let container = document.querySelector('.toast-container'); if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); } return container; }
function showToast(message, type = 'success', duration = 3800) { const container = ensureToastContainer(); const toast = document.createElement('div'); toast.className = `toast ${type}`; const icons = { success: 'fa-check', error: 'fa-xmark', info: 'fa-circle-info' }; toast.innerHTML = `<span class="t-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></span><span class="t-msg">${escapeHtml(message)}</span><button class="t-close"><i class="fa-solid fa-xmark"></i></button>`; container.appendChild(toast); const remove = () => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 250); }; toast.querySelector('.t-close').addEventListener('click', remove); setTimeout(remove, duration); }
function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
function timeAgo(dateStr) { const date = new Date(dateStr.replace(' ', 'T')); const seconds = Math.floor((new Date() - date) / 1000); if (seconds < 60) return 'just now'; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); if (days < 30) return `${days}d ago`; const months = Math.floor(days / 30); if (months < 12) return `${months}mo ago`; return `${Math.floor(months / 12)}y ago`; }
function formatDate(dateStr) { const date = new Date(dateStr.replace(' ', 'T')); return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getInitial(name) { return name ? name.trim().charAt(0).toUpperCase() : '?'; }
