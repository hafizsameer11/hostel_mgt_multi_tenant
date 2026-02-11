// ===============================
// Owner Floor Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
  createFloor,
  getAllFloors,
  getFloorsByHostel,
  getFloorById,
  updateFloor,
  deleteFloor,
} = require('../../../controllers/api/floor.controller');
const { authenticate, authorizeOwnerRoute } = require('../../../middleware/auth.middleware');

// All routes require owner authentication (admin can also access for management)
router.post('/floor', authenticate, authorizeOwnerRoute(), createFloor);
router.get('/floors', authenticate, authorizeOwnerRoute(), getAllFloors);
router.get('/floors/hostel/:hostelId', authenticate, authorizeOwnerRoute(), getFloorsByHostel);
router.get('/floor/:id', authenticate, authorizeOwnerRoute(), getFloorById);
router.put('/floor/:id', authenticate, authorizeOwnerRoute(), updateFloor);
router.delete('/floor/:id', authenticate, authorizeOwnerRoute(), deleteFloor);

module.exports = router;
