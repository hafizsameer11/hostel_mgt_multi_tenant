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
  getHostelStats,
  getHostelArchitecture,
  getHostelCategories,
} = require('../../../controllers/api/hostel.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// Apply authentication middleware to all routes
// Admin, owner, and employees can access (owner data will be filtered by controllers)
router.use(authenticate);

// ===============================
// Category Routes (must come before /:id routes)
// ===============================
router.get('/hostels/categories', getHostelCategories);

// ===============================
// Core Hostel Routes
// ===============================
router.get('/hostels', getAllHostels);
router.post('/hostels', createHostel);
router.get('/hostels/stats', getHostelStats);

// ===============================
// Owner-specific Routes
// ===============================
router.get('/hostel/owner/:ownerId', getAllHostels); // Get hostels by owner (will filter by buildHostelAccessFilter)
router.get('/hostels/:id/arrangement', getHostelArchitecture); // Alias for arrangement view

// ===============================
// Hostel Detail Routes (must be after /hostels/* specific routes)
// ===============================
router.get('/hostels/:id', getHostelById);
router.put('/hostels/:id', updateHostel);
router.delete('/hostels/:id', deleteHostel);

module.exports = router;


