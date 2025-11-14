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
} = require('../../../controllers/api/hostel.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

router.use(authenticate, authorize('admin', 'manager'));

router.post('/hostels', createHostel);
router.get('/hostels', getAllHostels);
router.get('/hostels/:id', getHostelById);
router.put('/hostels/:id', updateHostel);
router.get('/hostels/:id/stats', getHostelStats);
router.get('/hostels/:id/architecture', getHostelArchitecture);
router.delete('/hostels/:id', authorize('admin'), deleteHostel);

module.exports = router;


