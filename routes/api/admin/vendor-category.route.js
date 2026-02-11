const express = require('express');
const router = express.Router();
const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');
const {
  getVendorCategories,
  createVendorCategory,
  getVendorCategoryById,
  updateVendorCategory,
  deleteVendorCategory,
} = require('../../../controllers/api/vendor-category.controller');

// All routes require authentication
// Allow owner to access vendor categories (for their hostels)
router.use(authenticate);
// Use authorizeAdminOrOwner for GET routes, but allow owner for POST too

/**
 * =====================================================
 * VENDOR CATEGORY ROUTES
 * =====================================================
 * 
 * Base path: /api/admin/vendor-categories
 */

/**
 * GET /api/admin/vendor-categories
 * Get all vendor categories for the current user
 */
router.get('/vendor-categories', authorizeAdminOrOwner(), getVendorCategories);

/**
 * POST /api/admin/vendor-categories
 * Create a new vendor category
 * Body: { name, description? }
 * Allow owner to create vendor categories
 */
router.post('/vendor-categories', authorizeAdminOrOwner(), createVendorCategory);

/**
 * GET /api/admin/vendor-categories/:id
 * Get a vendor category by ID
 */
router.get('/vendor-categories/:id', authorizeAdminOrOwner(), getVendorCategoryById);

/**
 * PUT /api/admin/vendor-categories/:id
 * Update a vendor category
 * Body: { name?, description? }
 */
router.put('/vendor-categories/:id', authorizeAdminOrOwner(), updateVendorCategory);

/**
 * DELETE /api/admin/vendor-categories/:id
 * Delete a vendor category
 */
router.delete('/vendor-categories/:id', authorizeAdminOrOwner(), deleteVendorCategory);

module.exports = router;
