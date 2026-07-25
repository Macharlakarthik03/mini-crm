// ==========================================================
// Leads Page Logic — full CRUD, search, filter, sort
// ==========================================================
let allLeadsCache = [];
let searchDebounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  initShell();
  bindToolbar();
  bindModals();
  bindLeadForm();
  bindNotesForm();
  bindDeleteConfirm();
  loadLeads();
});

// ---------------- Shell (sidebar/logout/mobile) ----------------
function initShell() {
  const admin = Auth.getAdmin();
  if (admin) {
    document.getElementById('adminName').textContent = admin.username;
    document.getElementById('adminAvatar').textContent = getInitial(admin.username);
  }

  document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('mobileToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
}

// ---------------- Toolbar: search / filter / sort ----------------
function bindToolbar() {
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(loadLeads, 350);
  });
  document.getElementById('statusFilter').addEventListener('change', loadLeads);
  document.getElementById('sortSelect').addEventListener('change', loadLeads);
  document.getElementById('refreshBtn').addEventListener('click', loadLeads);
  document.getElementById('openAddModal').addEventListener('click', () => openLeadModal());
}

// ---------------- Load & render leads ----------------
async function loadLeads() {
  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;
  const sort = document.getElementById('sortSelect').value;

  const tbody = document.getElementById('leadsTableBody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="6"><span class="spinner" style="border-top-color:var(--primary); border-color:var(--border);"></span> Loading leads...</td></tr>`;

  try {
    const params = new URLSearchParams({ search, status, sort });
    const res = await apiRequest(`/leads?${params.toString()}`);
    allLeadsCache = res.data;
    renderLeadsTable(allLeadsCache);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--accent-red);">Failed to load leads: ${escapeHtml(err.message || 'Unknown error')}</td></tr>`;
  }
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadsTableBody');
  const countLabel = document.getElementById('resultCount');
  const headerLabel = document.getElementById('leadCountLabel');

  countLabel.textContent = `Showing ${leads.length} lead${leads.length !== 1 ? 's' : ''}`;
  headerLabel.textContent = `Manage all your client leads`;

  if (!leads.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="fa-solid fa-user-magnifying-glass"></i>
          <h3>No leads found</h3>
          <p>Try adjusting your search or filters, or add a new lead.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = leads.map((lead, idx) => `
    <tr style="animation-delay:${Math.min(idx * 30, 300)}ms">
      <td>
        <div class="lead-name-cell">
          <div class="initial">${getInitial(lead.name)}</div>
          <div class="info">
            <div class="n">${escapeHtml(lead.name)}</div>
            <div class="e">${escapeHtml(lead.email)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(lead.phone)}</td>
      <td><span class="pill source-pill">${escapeHtml(lead.source)}</span></td>
      <td>
        <select class="status-select st-${lead.status}" data-id="${lead.id}" onchange="handleStatusChange(this)">
          <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="Converted" ${lead.status === 'Converted' ? 'selected' : ''}>Converted</option>
        </select>
      </td>
      <td>${formatDate(lead.created_at)}</td>
      <td>
        <div class="row-actions" style="justify-content:flex-end;">
          <button class="icon-btn notes" title="Notes" onclick="openNotesModal(${lead.id})"><i class="fa-solid fa-note-sticky"></i></button>
          <button class="icon-btn" title="Edit" onclick="openLeadModal(${lead.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn danger" title="Delete" onclick="openDeleteModal(${lead.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---------------- Status change (inline dropdown) ----------------
async function handleStatusChange(selectEl) {
  const id = selectEl.dataset.id;
  const newStatus = selectEl.value;
  selectEl.className = `status-select st-${newStatus}`;

  try {
    await apiRequest(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Status updated to "${newStatus}".`, 'success');
    const cached = allLeadsCache.find(l => l.id == id);
    if (cached) cached.status = newStatus;
  } catch (err) {
    showToast(err.message || 'Failed to update status.', 'error');
    loadLeads();
  }
}

// ==========================================================
// MODALS: generic open/close
// ==========================================================
function bindModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// ==========================================================
// ADD / EDIT LEAD MODAL
// ==========================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

function openLeadModal(leadId = null) {
  const form = document.getElementById('leadForm');
  form.reset();
  clearAllFieldErrors();

  document.getElementById('leadId').value = leadId || '';

  if (leadId) {
    const lead = allLeadsCache.find(l => l.id == leadId);
    document.getElementById('leadModalTitle').textContent = 'Edit Lead';
    document.getElementById('leadSubmitText').innerHTML = '<i class="fa-solid fa-check"></i> Update Lead';
    if (lead) {
      document.getElementById('name').value = lead.name;
      document.getElementById('email').value = lead.email;
      document.getElementById('phone').value = lead.phone;
      document.getElementById('source').value = lead.source;
      document.getElementById('status').value = lead.status;
      document.getElementById('notes').value = lead.notes || '';
    }
  } else {
    document.getElementById('leadModalTitle').textContent = 'Add New Lead';
    document.getElementById('leadSubmitText').innerHTML = '<i class="fa-solid fa-check"></i> Save Lead';
  }

  openModal('leadModal');
  setTimeout(() => document.getElementById('name').focus(), 100);
}

function bindLeadForm() {
  document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('leadId').value;
    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      source: document.getElementById('source').value,
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value.trim()
    };

    if (!validateLeadForm(payload)) return;

    const submitBtn = document.getElementById('leadSubmitBtn');
    const submitText = document.getElementById('leadSubmitText');
    const originalHtml = submitText.innerHTML;
    submitBtn.disabled = true;
    submitText.innerHTML = '<span class="spinner"></span> Saving...';

    try {
      if (id) {
        await apiRequest(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Lead updated successfully.', 'success');
      } else {
        await apiRequest('/leads', { method: 'POST', body: JSON.stringify(payload) });
        showToast('New lead added successfully.', 'success');
      }
      closeModal('leadModal');
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to save lead.', 'error');
      // Highlight duplicate email server-side error
      if (err.message && err.message.toLowerCase().includes('email')) {
        setFieldError('fld-email', err.message);
      }
    } finally {
      submitBtn.disabled = false;
      submitText.innerHTML = originalHtml;
    }
  });
}

function validateLeadForm(payload) {
  clearAllFieldErrors();
  let valid = true;

  if (!payload.name || payload.name.length < 2) {
    setFieldError('fld-name', "Please enter the lead's name (min 2 characters).");
    valid = false;
  }
  if (!payload.email || !EMAIL_REGEX.test(payload.email)) {
    setFieldError('fld-email', 'Please enter a valid email address.');
    valid = false;
  }
  if (!payload.phone || !PHONE_REGEX.test(payload.phone)) {
    setFieldError('fld-phone', 'Please enter a valid phone number (7-20 digits).');
    valid = false;
  }
  if (!payload.source) {
    setFieldError('fld-source', 'Please select a source.');
    valid = false;
  }

  // Client-side duplicate check (against cached list) for quick feedback
  const id = document.getElementById('leadId').value;
  const dup = allLeadsCache.find(l =>
    l.email.toLowerCase() === payload.email.toLowerCase() && String(l.id) !== String(id)
  );
  if (dup) {
    setFieldError('fld-email', 'A lead with this email already exists.');
    valid = false;
  }

  return valid;
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  field.classList.add('invalid');
  const errEl = field.querySelector('.err-msg');
  if (errEl) errEl.textContent = message;
}

function clearAllFieldErrors() {
  document.querySelectorAll('.form-field').forEach(f => f.classList.remove('invalid'));
}

// ==========================================================
// NOTES MODAL
// ==========================================================
function openNotesModal(leadId) {
  const lead = allLeadsCache.find(l => l.id == leadId);
  if (!lead) return;

  document.getElementById('notesLeadId').value = leadId;
  document.getElementById('notesLeadName').textContent = `${lead.name} — ${lead.email}`;
  document.getElementById('notesTextarea').value = lead.notes || '';
  openModal('notesModal');
  setTimeout(() => document.getElementById('notesTextarea').focus(), 100);
}

function bindNotesForm() {
  document.getElementById('notesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('notesLeadId').value;
    const notes = document.getElementById('notesTextarea').value.trim();

    try {
      await apiRequest(`/leads/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ notes }) });
      showToast('Notes saved successfully.', 'success');
      closeModal('notesModal');
      const cached = allLeadsCache.find(l => l.id == id);
      if (cached) cached.notes = notes;
    } catch (err) {
      showToast(err.message || 'Failed to save notes.', 'error');
    }
  });
}

// ==========================================================
// DELETE CONFIRM MODAL
// ==========================================================
let pendingDeleteId = null;

function openDeleteModal(leadId) {
  const lead = allLeadsCache.find(l => l.id == leadId);
  pendingDeleteId = leadId;
  document.getElementById('deleteLeadName').textContent = lead ? lead.name : 'this lead';
  openModal('deleteModal');
}

function bindDeleteConfirm() {
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Deleting...';

    try {
      await apiRequest(`/leads/${pendingDeleteId}`, { method: 'DELETE' });
      showToast('Lead deleted successfully.', 'success');
      closeModal('deleteModal');
      loadLeads();
    } catch (err) {
      showToast(err.message || 'Failed to delete lead.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      pendingDeleteId = null;
    }
  });
}
