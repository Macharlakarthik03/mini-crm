// ==========================================================
// Lead Routes - All protected by authentication
// ==========================================================
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const verifyToken = require('../middleware/authMiddleware');

// All lead routes require a valid JWT
router.use(verifyToken);

router.get('/stats', leadController.getStats);
router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);
router.patch('/:id/status', leadController.updateStatus);
router.patch('/:id/notes', leadController.updateNotes);
router.delete('/:id', leadController.deleteLead);

module.exports = router;
