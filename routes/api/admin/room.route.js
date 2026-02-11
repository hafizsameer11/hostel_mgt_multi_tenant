// ===============================
// Room Routes
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
    deleteRoom
} = require('../../../controllers/api/room.controller');
const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');

// All routes require authentication - Admin routes (owner should use /api/owner/room routes)
// Admin sees everything, employees need permissions

// Create room
router.post('/room', authenticate, authorize('admin', 'manager', 'staff'), createRoom);

// Get all rooms
router.get('/rooms', authenticate, authorize('admin', 'manager', 'staff'), getAllRooms);

// Get rooms by hostel
router.get('/room/hostel/:hostelId', authenticate, authorizeAdminOrOwner(), getRoomsByHostel);

// Get rooms by floor
router.get('/room/floor/:floorId', authenticate, authorize('admin', 'manager', 'staff'), getRoomsByFloor);

// Get room by ID
router.get('/room/:id', authenticate, authorize('admin', 'manager', 'staff'), getRoomById);

// Update room
router.put('/room/:id', authenticate, authorize('admin', 'manager', 'staff'), updateRoom);

// Update room status
router.put('/room/:id/status', authenticate, authorize('admin', 'manager', 'staff'), updateRoomStatus);

// Schedule maintenance
router.post('/rooms/:id/maintenance', authenticate, authorize('admin', 'manager', 'staff'), scheduleMaintenance);

// Delete room - Admin only
router.delete('/room/:id', authenticate, authorize('admin'), deleteRoom);

module.exports = router;


