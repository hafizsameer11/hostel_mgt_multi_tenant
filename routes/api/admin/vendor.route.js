const express = require('express');
const router = express.Router();
const {
  createVendor,
  listVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  updateVendorFinancials,
  recordVendorScore,
  getVendorScores,
} = require('../../../controllers/api/vendor.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// 🔒 All vendor routes are protected
router.use(authenticate);
router.use(authorize('admin', 'manager'));

/**
 * @route   POST /api/admin/vendors
 * @desc    Create new vendor
 * @access  Admin, Manager
 */
router.post('/vendors', createVendor);

/**
 * @route   GET /api/admin/vendors
 * @desc    Get all vendors with filters, pagination, and sorting
 * @query   search, status, category, paymentTerms, hostelId, page, limit, sortBy, sortOrder
 * @access  Admin, Manager
 */
router.get('/vendors', listVendors);

/**
 * @route   GET /api/admin/vendors/:id
 * @desc    Get vendor by ID with recent scores
 * @access  Admin, Manager
 */
router.get('/vendors/:id', getVendorById);

/**
 * @route   PUT /api/admin/vendors/:id
 * @desc    Update vendor details
 * @access  Admin, Manager
 */
router.put('/vendors/:id', updateVendor);

/**
 * @route   DELETE /api/admin/vendors/:id
 * @desc    Delete vendor
 * @access  Admin
 */
router.delete('/vendors/:id', authorize('admin'), deleteVendor);

/**
 * @route   PATCH /api/admin/vendors/:id/financials
 * @desc    Update vendor financial balances (totalPayable, totalPaid, balance)
 * @access  Admin, Manager
 */
router.patch('/vendors/:id/financials', updateVendorFinancials);

/**
 * @route   POST /api/admin/vendors/:id/score
 * @desc    Record a vendor score
 * @access  Admin, Manager
 */
router.post('/vendors/:id/score', recordVendorScore);

/**
 * @route   GET /api/admin/vendors/:id/scores
 * @desc    Get vendor score history
 * @access  Admin, Manager
 */
router.get('/vendors/:id/scores', getVendorScores);

module.exports = router;
