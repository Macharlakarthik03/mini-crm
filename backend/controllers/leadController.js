// ==========================================================
// Lead Controller - CRUD, search, filter, sort, stats
// ==========================================================
const LeadModel = require('../models/leadModel');

const VALID_SOURCES = ['Website', 'Facebook', 'Instagram', 'LinkedIn', 'Referral'];
const VALID_STATUSES = ['New', 'Contacted', 'Converted'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

function validateLeadInput({ name, email, phone, source, status, notes }, isUpdate = false) {
  const errors = [];

  if (!name || !name.trim()) errors.push('Name is required.');
  else if (name.trim().length < 2) errors.push('Name must be at least 2 characters.');

  if (!email || !email.trim()) errors.push('Email is required.');
  else if (!EMAIL_REGEX.test(email.trim())) errors.push('Please provide a valid email address.');

  if (!phone || !phone.trim()) errors.push('Phone number is required.');
  else if (!PHONE_REGEX.test(phone.trim())) errors.push('Please provide a valid phone number.');

  if (!source || !VALID_SOURCES.includes(source)) {
    errors.push(`Source must be one of: ${VALID_SOURCES.join(', ')}.`);
  }

  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors;
}

// GET /api/leads
exports.getAllLeads = async (req, res) => {
  try {
    const { search = '', status = 'All', sort = 'latest' } = req.query;
    const leads = await LeadModel.getAll({ search: search.trim(), status, sort });
    return res.status(200).json({ success: true, data: leads });
  } catch (err) {
    console.error('Get leads error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch leads.' });
  }
};

// GET /api/leads/stats
exports.getStats = async (req, res) => {
  try {
    const stats = await LeadModel.getStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('Get stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};

// GET /api/leads/:id
exports.getLeadById = async (req, res) => {
  try {
    const lead = await LeadModel.getById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    console.error('Get lead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch lead.' });
  }
};

// POST /api/leads
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, source, status, notes } = req.body;

    const errors = validateLeadInput({ name, email, phone, source, status, notes });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    // Prevent duplicate email
    const existing = await LeadModel.findByEmail(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A lead with this email already exists.'
      });
    }

    const newLead = await LeadModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      source,
      status: status || 'New',
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully.',
      data: newLead
    });
  } catch (err) {
    console.error('Create lead error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A lead with this email already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create lead.' });
  }
};

// PUT /api/leads/:id
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, source, status, notes } = req.body;

    const lead = await LeadModel.getById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const errors = validateLeadInput({ name, email, phone, source, status, notes }, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    // Prevent duplicate email (excluding this lead itself)
    const existing = await LeadModel.findByEmail(email.trim().toLowerCase(), id);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Another lead with this email already exists.'
      });
    }

    const updatedLead = await LeadModel.update(id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      source,
      status: status || lead.status,
      notes: notes !== undefined ? notes.trim() : lead.notes
    });

    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully.',
      data: updatedLead
    });
  } catch (err) {
    console.error('Update lead error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Another lead with this email already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update lead.' });
  }
};

// PATCH /api/leads/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const lead = await LeadModel.getById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const updated = await LeadModel.updateStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Lead status updated.',
      data: updated
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

// PATCH /api/leads/:id/notes
exports.updateNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const lead = await LeadModel.getById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    const updated = await LeadModel.updateNotes(id, notes ? notes.trim() : '');
    return res.status(200).json({
      success: true,
      message: 'Notes updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Update notes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notes.' });
  }
};

// DELETE /api/leads/:id
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await LeadModel.getById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    await LeadModel.delete(id);
    return res.status(200).json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    console.error('Delete lead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete lead.' });
  }
};
