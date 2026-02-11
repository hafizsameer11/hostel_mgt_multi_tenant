const express = require('express');
const router = express.Router();
const {
  getServiceManagement,
  getAllServices,
} = require('../../../controllers/api/vendor-management.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

// All routes require authentication - User can only see services related to their bookings/allocations
router.use(authenticate);

/**
 * =====================================================
 * USER VENDOR MANAGEMENT ROUTES - User's Own Services
 * =====================================================
 * 
 * Base path: /api/user/vendor-management
 * 
 * Users can only see vendor services related to their own bookings/allocations
 */

/**
 * Get Service Management for User
 * GET /api/user/vendor-management/services
 * 
 * Query Parameters:
 * - status? - Filter by status (active|inactive|completed)
 * - page? - Page number (default: 1)
 * - limit? - Items per page (default: 20)
 * 
 * Returns: Services related to user's bookings/allocations
 */
router.get('/vendor-management/services', getServiceManagement);

/**
 * Get All Services for User
 * GET /api/user/vendor-management/all-services
 * 
 * Query Parameters:
 * - category? - Filter by service category
 * - page? - Page number (default: 1)
 * - limit? - Items per page (default: 20)
 * 
 * Returns: All services available to user (related to their hostels)
 */
router.get('/vendor-management/all-services', getAllServices);

module.exports = router;
