// ===============================
// Owner Mess Management Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
  getMessEntriesByHostel,
  getMessEntryById,
  createMessEntry,
  updateMessEntry,
  deleteMessEntry,
  getMessStats,
} = require('../../../controllers/api/mess.controller');
const { authenticate, authorizeOwnerRoute } = require('../../../middleware/auth.middleware');

// All routes require owner authentication (admin can also access for management)
router.get('/mess/hostel/:hostelId', authenticate, authorizeOwnerRoute(), getMessEntriesByHostel);
router.get('/mess/hostel/:hostelId/stats', authenticate, authorizeOwnerRoute(), getMessStats);
router.get('/mess/:id', authenticate, authorizeOwnerRoute(), getMessEntryById);
router.post('/mess', authenticate, authorizeOwnerRoute(), createMessEntry);
router.put('/mess/:id', authenticate, authorizeOwnerRoute(), updateMessEntry);
router.delete('/mess/:id', authenticate, authorizeOwnerRoute(), deleteMessEntry);

module.exports = router;
