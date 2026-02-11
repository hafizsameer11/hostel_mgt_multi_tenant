// ===============================
// Mess Management Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    getMessEntriesByHostel,
    getMessEntryById,
    createMessEntry,
    updateMessEntry,
    deleteMessEntry,
    getMessStats
} = require('../../../controllers/api/mess.controller');
const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');

// All routes require authentication - Admin routes (owner should use /api/owner/mess routes)
// Admin sees everything, employees need permissions

// Get all mess entries for a hostel
router.get('/mess/hostel/:hostelId', authenticate, authorizeAdminOrOwner(), getMessEntriesByHostel);

// Get mess stats for a hostel
router.get('/mess/hostel/:hostelId/stats', authenticate, authorizeAdminOrOwner(), getMessStats);

// Get mess entry by ID
router.get('/mess/:id', authenticate, authorizeAdminOrOwner(), getMessEntryById);

// Create mess entry
router.post('/mess', authenticate, authorizeAdminOrOwner(), createMessEntry);

// Update mess entry
router.put('/mess/:id', authenticate, authorizeAdminOrOwner(), updateMessEntry);

// Delete mess entry
router.delete('/mess/:id', authenticate, authorizeAdminOrOwner(), deleteMessEntry);

module.exports = router;
