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
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// All routes require authentication and admin/manager role



// Get all rooms (Admin & Manager only)
router.get('/rooms', authenticate, getAllRooms);

// Get rooms by hostel (Admin & Manager only)
router.get('/room/hostel/:hostelId',  getRoomsByHostel);

// Get rooms by floor (Admin & Manager only)
router.get('/room/floor/:floorId',  getRoomsByFloor);

// Get room by ID (Admin & Manager only)
router.get('/room/:id',  getRoomById);


module.exports = router;


