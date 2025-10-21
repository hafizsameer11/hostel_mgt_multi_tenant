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



// Get all hostels (Admin & Manager only)
router.get('/hostels', authenticate, getAllHostels);

// Get hostel by ID (Admin & Manager only)
router.get('/hostel/:id', authenticate, getHostelById);



module.exports = router;


