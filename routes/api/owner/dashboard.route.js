const express = require('express');
const router = express.Router();
const { authenticate, authorize, authorizeOwnerRoute } = require('../../../middleware/auth.middleware');

// Import owner controllers
const dashboardController = require('../../../controllers/api/owner/dashboard.controller');
const hostelController = require('../../../controllers/api/owner/hostel.controller');

// =================== DASHBOARD ROUTES ===================
// Owner routes - only owner role can access (admin can also access for management)
router.get('/dashboard/overview', authenticate, authorizeOwnerRoute(), dashboardController.getOwnerOverview);
router.get('/dashboard/activity-log', authenticate, authorizeOwnerRoute(), dashboardController.getOwnerActivityLog);
router.get('/dashboard/stats', authenticate, authorizeOwnerRoute(), dashboardController.getOwnerStats);

// =================== HOSTEL ROUTES ===================
router.get('/hostels', authenticate, authorizeOwnerRoute(), hostelController.getOwnerHostels);
router.get('/hostels/:id', authenticate, authorizeOwnerRoute(), hostelController.getOwnerHostelDetails);
router.put('/hostels/:id', authenticate, authorizeOwnerRoute(), hostelController.updateOwnerHostel);
router.get('/hostels/:id/bookings', authenticate, authorizeOwnerRoute(), hostelController.getOwnerHostelBookings);
router.get('/hostels/:id/employees', authenticate, authorizeOwnerRoute(), hostelController.getOwnerHostelEmployees);

module.exports = router;
