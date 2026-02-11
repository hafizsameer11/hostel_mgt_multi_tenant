// ===============================
// Owner Room Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
  createRoom,
  getAllRooms,
  getRoomsByHostel,
  getRoomsByFloor,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  scheduleMaintenance,
  deleteRoom,
} = require('../../../controllers/api/room.controller');
const { authenticate, authorizeOwnerRoute } = require('../../../middleware/auth.middleware');

// All routes require owner authentication (admin can also access for management)
router.post('/room', authenticate, authorizeOwnerRoute(), createRoom);
router.get('/rooms', authenticate, authorizeOwnerRoute(), getAllRooms);
router.get('/room/hostel/:hostelId', authenticate, authorizeOwnerRoute(), getRoomsByHostel);
router.get('/room/floor/:floorId', authenticate, authorizeOwnerRoute(), getRoomsByFloor);
router.get('/room/:id', authenticate, authorizeOwnerRoute(), getRoomById);
router.put('/room/:id', authenticate, authorizeOwnerRoute(), updateRoom);
router.put('/room/:id/status', authenticate, authorizeOwnerRoute(), updateRoomStatus);
router.post('/rooms/:id/maintenance', authenticate, authorizeOwnerRoute(), scheduleMaintenance);
router.delete('/room/:id', authenticate, authorizeOwnerRoute(), deleteRoom);

module.exports = router;
