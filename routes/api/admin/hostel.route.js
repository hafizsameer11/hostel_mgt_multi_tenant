// ===============================
// Hostel Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    createHostel,
    getAllHostels,
    getHostelById,
    updateHostel,
    deleteHostel,
    getHostelStats
} = require('../../../controllers/api/hostel.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// All routes require authentication and admin/manager role

// Create hostel (Admin & Manager only)
router.post('/hostel', authenticate, authorize('admin', 'manager'), createHostel);

// Get all hostels (Admin & Manager only)
router.get('/hostels', authenticate, authorize('admin', 'manager'), getAllHostels);

// Get hostel by ID (Admin & Manager only)
router.get('/hostel/:id', authenticate, authorize('admin', 'manager'), getHostelById);

// Get hostel statistics (Admin & Manager only)
router.get('/hostel/:id/stats', authenticate, authorize('admin', 'manager'), getHostelStats);

// Update hostel (Admin & Manager only)
router.put('/hostel/:id', authenticate, authorize('admin', 'manager'), updateHostel);

// Delete hostel (Admin only)
router.delete('/hostel/:id', authenticate, authorize('admin'), deleteHostel);

module.exports = router;


