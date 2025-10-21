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
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// All routes require authentication and admin/manager role


// Get all floors (Admin & Manager only)
router.get('/floors', authenticate, getAllFloors);

// Get floors by hostel (Admin & Manager only)
router.get('/floors/hostel/:hostelId', authenticate, authorize('admin', 'manager'), getFloorsByHostel);

// Get floor by ID (Admin & Manager only)
router.get('/floor/:id', authenticate,  getFloorById);


module.exports = router;


