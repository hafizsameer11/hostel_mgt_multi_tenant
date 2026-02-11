const express = require('express');
const router = express.Router();
const {
    getAllAlerts,
    getAlertById,
    getAlertStats,
} = require('../../../controllers/api/alert.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

// All routes require authentication - User can only see their own alerts
router.use(authenticate);

/**
 * =====================================================
 * USER ALERT ROUTES - User's Own Alerts Only
 * =====================================================
 * 
 * Base path: /api/user/alerts
 * 
 * Users can only see alerts related to their own bookings/allocations
 */

/**
 * @route   GET /api/user/alerts/stats
 * @desc    Get alert statistics for current user
 * @access  Authenticated User
 * @returns { danger, warning, info, tabs: { bills, maintenance }, total, pending, overdue, ... }
 */
router.get('/alerts/stats', getAlertStats);

/**
 * @route   GET /api/user/alerts
 * @desc    Get all alerts for current user (filtered by user's bookings/allocations)
 * @access  Authenticated User
 * @query   type? - Filter by type (bill|maintenance)
 * @query   status? - Filter by status (pending|resolved|overdue)
 * @query   page? - Page number (default: 1)
 * @query   limit? - Items per page (default: 20)
 * @returns { alerts: [], pagination: { total, page, limit, totalPages } }
 */
router.get('/alerts', getAllAlerts);

/**
 * @route   GET /api/user/alerts/:id
 * @desc    Get alert by ID (only if it belongs to current user)
 * @access  Authenticated User
 * @params  id - Alert ID
 * @returns Alert details
 */
router.get('/alerts/:id', getAlertById);

module.exports = router;
