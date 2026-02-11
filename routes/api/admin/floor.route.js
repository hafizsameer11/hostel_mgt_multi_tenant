// ===============================
// Floor Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    createFloor,
    getAllFloors,
    getFloorsByHostel,
    getFloorById,
    updateFloor,
    deleteFloor
} = require('../../../controllers/api/floor.controller');
const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');

// All routes require authentication - Admin routes (owner should use /api/owner/floor routes)
// Admin sees everything, employees need permissions

// Create floor
router.post('/floor', authenticate, authorize('admin', 'manager', 'staff'), createFloor);

// Get all floors
router.get('/floors', authenticate, authorize('admin', 'manager', 'staff'), getAllFloors);

// Get floors by hostel - Allow owner access (will be filtered by their hostels in controller)
router.get('/floors/hostel/:hostelId', authenticate, authorizeAdminOrOwner(), getFloorsByHostel);

// Get floor by ID
router.get('/floor/:id', authenticate, authorize('admin', 'manager', 'staff'), getFloorById);

// Update floor
router.put('/floor/:id', authenticate, authorize('admin', 'manager', 'staff'), updateFloor);

// Delete floor - Admin only
router.delete('/floor/:id', authenticate, authorize('admin'), deleteFloor);

module.exports = router;


