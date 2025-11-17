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

// Apply authentication and authorization middleware to all routes
router.use(authenticate, authorize('admin', 'manager'));

// ===============================
// Category Routes (must come before /:id routes)
// ===============================
router.get('/hostels/categories', getHostelCategories);

// ===============================
// Hostel CRUD Routes
// ===============================
router.post('/hostels', createHostel); // Create new hostel
router.get('/hostels', getAllHostels); // Get all hostels (with filters)

// ===============================
// Hostel Detail Routes (must come after /categories)
// ===============================
router.get('/hostels/:id', getHostelById); // Get hostel by ID
router.put('/hostels/:id', updateHostel); // Update hostel
router.delete('/hostels/:id', authorize('admin'), deleteHostel); // Delete hostel (admin only)

// ===============================
// Hostel Sub-resource Routes
// ===============================
router.get('/hostels/:id/stats', getHostelStats); // Get hostel statistics
router.get('/hostels/:id/architecture', getHostelArchitecture); // Get hostel architecture
router.get('/hostels/:id/arrangement', getHostelArchitecture); // Alias for arrangement view

module.exports = router;


