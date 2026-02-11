// ===============================
// Owner Bed Routes
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
} = require('../../../controllers/api/bed.controller');
const { authenticate, authorizeOwnerRoute } = require('../../../middleware/auth.middleware');

// All routes require owner authentication (admin can also access for management)
router.post('/bed', authenticate, authorizeOwnerRoute(), createBed);
router.post('/beds/bulk', authenticate, authorizeOwnerRoute(), createMultipleBeds);
router.get('/beds', authenticate, authorizeOwnerRoute(), getAllBeds);
router.get('/beds/room/:roomId', authenticate, authorizeOwnerRoute(), getBedsByRoom);
router.get('/bed/:id', authenticate, authorizeOwnerRoute(), getBedById);
router.put('/bed/:id', authenticate, authorizeOwnerRoute(), updateBed);
router.patch('/bed/:id/status', authenticate, authorizeOwnerRoute(), updateBedStatus);
router.delete('/bed/:id', authenticate, authorizeOwnerRoute(), deleteBed);

module.exports = router;
