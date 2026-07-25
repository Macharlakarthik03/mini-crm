// Dashboard logic copied to backend/public/js
document.addEventListener('DOMContentLoaded', () => { Auth.requireAuth(); initShell(); loadDashboard(); });
function initShell() {
  const admin = Auth.getAdmin(); if (admin) { document.getElementById('adminName').textContent = admin.username; document.getElementById('adminAvatar').textContent = getInitial(admin.username); }
  document.getElementById('logoutBtn').addEventListener('click', () => { Auth.logout(); });
  const todayEl = document.getElementById('todayDate'); if (todayEl) { todayEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
  const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebarOverlay'); const toggle = document.getElementById('mobileToggle'); if (toggle) { toggle.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); }); overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); }); }
}
async function loadDashboard() {
  try {
    const [statsRes, leadsRes] = await Promise.all([ apiRequest('/leads/stats'), apiRequest('/leads?sort=latest') ]);
    animateCount('statTotal', statsRes.data.total); animateCount('statNew', statsRes.data.newLeads); animateCount('statContacted', statsRes.data.contacted); animateCount('statConverted', statsRes.data.converted);
    renderRecentLeads(leadsRes.data.slice(0,6)); renderSourceBreakdown(leadsRes.data);
  } catch (err) { showToast(err.message || 'Failed to load dashboard data.', 'error'); }
}
function animateCount(elId, target) { const el = document.getElementById(elId); let current = 0; const step = Math.max(1, Math.ceil(target / 30)); const timer = setInterval(() => { current += step; if (current >= target) { current = target; clearInterval(timer); } el.textContent = current; }, 25); }
function renderRecentLeads(leads) { const container = document.getElementById('recentLeadsList'); if (!leads.length) { container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>No leads yet</h3><p>Add your first lead to see it here.</p></div>`; return; } const statusColor = { New: '#B77816', Contacted: '#3E58C4', Converted: '#178A3E' }; container.innerHTML = leads.map(lead => `<div class="mini-list-row"><div class="who"><div class="initial">${getInitial(lead.name)}</div><div class="who-info"><div class="name">${escapeHtml(lead.name)}</div><div class="meta">${escapeHtml(lead.source)} &middot; ${timeAgo(lead.created_at)}</div></div></div><span class="pill source-pill" style="color:${statusColor[lead.status]}; background:${statusColor[lead.status]}1A;">${lead.status}</span></div>`).join(''); }
function renderSourceBreakdown(leads) { const sources = ['Website','Facebook','Instagram','LinkedIn','Referral']; const counts = {}; sources.forEach(s => counts[s] = 0); leads.forEach(l => { if (counts[l.source] !== undefined) counts[l.source]++; }); const total = leads.length || 1; const container = document.getElementById('sourceBreakdown'); container.innerHTML = sources.map(source => { const count = counts[source]; const pct = Math.round((count / total) * 100); return `<div class="source-row"><div class="top"><span class="name">${source}</span><span class="count">${count}</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;"></div></div></div>`; }).join(''); }
