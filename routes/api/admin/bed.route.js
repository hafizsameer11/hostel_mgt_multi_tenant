// ===============================
// Bed Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    createBed,
    createMultipleBeds,
    getAllBeds,
    getBedsByRoom,
    getBedById,
    updateBed,
    updateBedStatus,
    deleteBed,
    getAvailableBeds
} = require('../../../controllers/api/bed.controller');
const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');

// All routes require authentication - Admin routes (owner should use /api/owner/bed routes)
// Admin sees everything, employees need permissions

// Create bed
router.post('/bed', authenticate, authorize('admin', 'manager', 'staff'), createBed);

// Create multiple beds at once
router.post('/beds/bulk', authenticate, authorize('admin', 'manager', 'staff'), createMultipleBeds);

// Get all beds
router.get('/beds', authenticate, authorize('admin', 'manager', 'staff'), getAllBeds);

// Get beds by room - Allow owner access (will be filtered by their hostels in controller)
router.get('/beds/room/:roomId', authenticate, authorizeAdminOrOwner(), getBedsByRoom);

// Get bed by ID
router.get('/bed/:id', authenticate, authorize('admin', 'manager', 'staff'), getBedById);

// Update bed
router.put('/bed/:id', authenticate, authorize('admin', 'manager', 'staff'), updateBed);

// Update bed status
router.patch('/bed/:id/status', authenticate, authorize('admin', 'manager', 'staff'), updateBedStatus);

// Delete bed - Admin only
router.delete('/bed/:id', authenticate, authorize('admin'), deleteBed);

module.exports = router;


