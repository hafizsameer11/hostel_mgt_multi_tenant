// ===============================
// Owner Allocation Routes
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
  updateBedAllocation,
} = require('../../../controllers/api/allocation.controller');
const { authenticate, authorizeOwnerRoute } = require('../../../middleware/auth.middleware');

// All routes require owner authentication (admin can also access for management)
router.post('/allocation', authenticate, authorizeOwnerRoute(), allocateTenant);
router.post('/allocations/:allocationId/checkout', authenticate, authorizeOwnerRoute(), checkOutTenant);
router.post('/allocations/:allocationId/transfer', authenticate, authorizeOwnerRoute(), transferTenant);
router.get('/allocations', authenticate, authorizeOwnerRoute(), getAllAllocations);
router.get('/allocations/hostel/:hostelId/active', authenticate, authorizeOwnerRoute(), getActiveAllocationsByHostel);
router.get('/allocation/:id', authenticate, authorizeOwnerRoute(), getAllocationById);
router.put('/allocation/:id', authenticate, authorizeOwnerRoute(), updateAllocation);
router.put('/allocation/bed/:id', authenticate, authorizeOwnerRoute(), updateBedAllocation);

module.exports = router;
