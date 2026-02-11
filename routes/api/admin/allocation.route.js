// ===============================
// Allocation Routes (Tenant Management)
// ===============================

const express = require('express');
const router = express.Router();
const {
    allocateTenant,
    checkOutTenant,
    transferTenant,
    getAllAllocations,
    getAllocationById,
    getActiveAllocationsByHostel,
    updateAllocation,
    updateBedAllocation
} = require('../../../controllers/api/allocation.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// All routes require authentication - Admin routes (owner should use /api/owner/allocation routes)
// Admin sees everything, employees need permissions

// Allocate tenant to bed
router.post('/allocation', authenticate, authorize('admin', 'manager', 'staff'), allocateTenant);

// Check out tenant
router.post('/allocations/:allocationId/checkout', authenticate, authorize('admin', 'manager', 'staff'), checkOutTenant);

// Transfer tenant to another bed
router.post('/allocations/:allocationId/transfer', authenticate, authorize('admin', 'manager', 'staff'), transferTenant);

// Get all allocations
router.get('/allocations', authenticate, authorize('admin', 'manager', 'staff'), getAllAllocations);

// Get active allocations by hostel
router.get('/allocations/hostel/:hostelId/active', authenticate, authorize('admin', 'manager', 'staff'), getActiveAllocationsByHostel);

// Get allocation by ID
router.get('/allocation/:id', authenticate, authorize('admin', 'manager', 'staff'), getAllocationById);

// Update allocation
router.put('/allocation/:id', authenticate, authorize('admin', 'manager', 'staff'), updateAllocation);

// Update bed allocation - change which bed a tenant is assigned to
router.put('/allocation/bed/:id', authenticate, authorize('admin', 'manager', 'staff'), updateBedAllocation);

module.exports = router;


