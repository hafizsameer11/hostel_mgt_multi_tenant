// ===============================
// Bed Controller
// ===============================

const { successResponse, errorResponse } = require('../../Helper/helper');
const { prisma } = require('../../config/db');

// ===================================
// CREATE BED
// ===================================
const createBed = async (req, res) => {
    try {
        const {
            room,
            bedNumber,
            bedType,
            position
        } = req.body;

        // Validation
        if (!room || !bedNumber) {
            return errorResponse(res, "Room and bed number are required", 400);
        }

        const roomId = parseInt(room,10);
        // Check if room exists
        const roomExists = await prisma.room.findUnique({
            where: { id: roomId }
        });
        
        if (!roomExists) {
            return errorResponse(res, "Room not found", 404);
        }

        // Check if room has reached bed capacity
        const existingBeds = await prisma.bed.count({ where: { roomId: room } });
        if (existingBeds >= roomExists.totalBeds) {
            return errorResponse(res, "Room has reached maximum bed capacity", 400);
        }

        // Check if bed number already exists in this room
        const existingBed = await prisma.bed.findUnique({
            where: {
                roomId_bedNumber: {
                    roomId: room,
                    bedNumber: bedNumber
                }
            }
        });
        
        if (existingBed) {
            return errorResponse(res, "Bed number already exists in this room", 400);
        }

        // Create bed
        const bed = await prisma.bed.create({
            data: {
                roomId: roomId,
                bedNumber,
                bedType: bedType || 'single',
                position: position ? {
                    x: position.x || null,
                    y: position.y || null
                } : null
            },
            include: {
                room: {
                    select: { 
                        roomNumber: true, 
                        roomType: true,
                        floor: {
                            select: {
                                floorNumber: true,
                                hostel: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        return successResponse(res, bed, "Bed created successfully", 201);
    } catch (err) {
        console.error("Create Bed Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// CREATE MULTIPLE BEDS
// ===================================
const createMultipleBeds = async (req, res) => {
    try {
        const { roomId, numberOfBeds, bedType, startNumber = 1 } = req.body;

        if (!roomId || !numberOfBeds) {
            return errorResponse(res, "Room ID and number of beds are required", 400);
        }

        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });
        
        if (!room) {
            return errorResponse(res, "Room not found", 404);
        }

        // Check capacity
        const existingBeds = await prisma.bed.count({ where: { roomId } });
        if (existingBeds + numberOfBeds > room.totalBeds) {
            return errorResponse(res, `Can only create ${room.totalBeds - existingBeds} more beds`, 400);
        }

        // Create beds
        const bedsData = [];
        for (let i = 0; i < numberOfBeds; i++) {
            bedsData.push({
                roomId: roomId,
                bedNumber: `${room.roomNumber}-B${startNumber + i}`,
                bedType: bedType || 'single'
            });
        }

        const createdBeds = await prisma.bed.createMany({
            data: bedsData
        });

        return successResponse(res, { count: createdBeds.count }, `${numberOfBeds} beds created successfully`, 201);
    } catch (err) {
        console.error("Create Multiple Beds Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ALL BEDS
// ===================================
const getAllBeds = async (req, res) => {
    try {
        const { hostel, floor, room, status } = req.query;

        // Build filter
        const where = {};
        if (room) {
            where.roomId = room;
        } else if (floor || hostel) {
            where.room = {};
            if (floor) where.room.floorId = floor;
            if (hostel) where.room.hostelId = hostel;
        }
        if (status) where.status = status;

        const beds = await prisma.bed.findMany({
            where,
            include: {
                room: {
                    select: { 
                        roomNumber: true, 
                        roomType: true,
                        floor: {
                            select: {
                                floorNumber: true,
                                hostel: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                currentTenant: {
                    select: { name: true, email: true, phone: true }
                }
            },
            orderBy: [
                { roomId: 'asc' },
                { bedNumber: 'asc' }
            ]
        });

        return successResponse(res, beds, "Beds retrieved successfully", 200);
    } catch (err) {
        console.error("Get All Beds Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET BEDS BY ROOM
// ===================================
const getBedsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const convertRoomId = parseInt(roomId,10);
        const room = await prisma.room.findUnique({
            where: { id: convertRoomId }
        });
        if (!room) {
            return errorResponse(res, "Room not found", 404);
        }

        const beds = await prisma.bed.findMany({
            where: { roomId: convertRoomId },
            include: {
                currentTenant: {
                    select: { name: true, email: true, phone: true }
                }
            },
            orderBy: { bedNumber: 'asc' }
        });

        return successResponse(res, beds, "Beds retrieved successfully", 200);
    } catch (err) {
        console.error("Get Beds By Room Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET BED BY ID
// ===================================
const getBedById = async (req, res) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id,10);
        const bed = await prisma.bed.findUnique({
            where: { id: roomId },
            include: {
                room: {
                    select: { 
                        roomNumber: true, 
                        roomType: true,
                        floor: {
                            select: {
                                floorNumber: true,
                                floorName: true,
                                hostel: {
                                    select: { name: true, address: true }
                                }
                            }
                        }
                    }
                },
                currentTenant: {
                    select: { name: true, email: true, phone: true }
                },
                reservedBy: {
                    select: { name: true, email: true, phone: true }
                }
            }
        });

        if (!bed) {
            return errorResponse(res, "Bed not found", 404);
        }

        return successResponse(res, bed, "Bed retrieved successfully", 200);
    } catch (err) {
        console.error("Get Bed Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// UPDATE BED
// ===================================
const updateBed = async (req, res) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id,10);
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates.hostel;
        delete updates.hostelId;
        delete updates.floor;
        delete updates.floorId;
        delete updates.room;
        delete updates.roomId;
        delete updates.currentTenant;
        delete updates.currentTenantId;

        // Prepare update data
        const updateData = {};
        if (updates.bedNumber) updateData.bedNumber = updates.bedNumber;
        if (updates.bedType) updateData.bedType = updates.bedType;
        if (updates.status) updateData.status = updates.status;
        if (updates.condition) updateData.condition = updates.condition;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.reservedById !== undefined) updateData.reservedById = updates.reservedById;
        if (updates.reservationExpiry !== undefined) updateData.reservationExpiry = updates.reservationExpiry;
        
        if (updates.position) {
            updateData.position = {
                x: updates.position.x || null,
                y: updates.position.y || null
            };
        }

        const bed = await prisma.bed.update({
            where: { id: roomId },
            data: updateData,
            include: {
                room: {
                    select: { roomNumber: true, roomType: true }
                },
                currentTenant: {
                    select: { name: true, email: true }
                }
            }
        });

        return successResponse(res, bed, "Bed updated successfully", 200);
    } catch (err) {
        if (err.code === 'P2025') {
            return errorResponse(res, "Bed not found", 404);
        }
        console.error("Update Bed Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// UPDATE BED STATUS
// ===================================
const updateBedStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id,10);
        const { status } = req.body;

        if (!['available', 'occupied', 'reserved', 'under_maintenance'].includes(status)) {
            return errorResponse(res, "Invalid status", 400);
        }

        const bed = await prisma.bed.update({
            where: { id: roomId },
            data: { status },
            include: {
                room: {
                    select: { roomNumber: true }
                }
            }
        });

        return successResponse(res, bed, "Bed status updated successfully", 200);
    } catch (err) {
        if (err.code === 'P2025') {
            return errorResponse(res, "Bed not found", 404);
        }
        console.error("Update Bed Status Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// DELETE BED
// ===================================
const deleteBed = async (req, res) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id,10);

        const bed = await prisma.bed.findUnique({
            where: { id: roomId }
        });
        
        if (!bed) {
            return errorResponse(res, "Bed not found", 404);
        }

        // Check if bed is occupied
        if (bed.status === 'occupied' || bed.currentTenantId) {
            return errorResponse(res, "Cannot delete occupied bed. Please deallocate tenant first.", 400);
        }

        await prisma.bed.delete({
            where: { id: roomId }
        });

        return successResponse(res, { id }, "Bed deleted successfully", 200);
    } catch (err) {
        console.error("Delete Bed Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET AVAILABLE BEDS
// ===================================
const getAvailableBeds = async (req, res) => {
    try {
        const { hostelId } = req.params;

        const beds = await prisma.bed.findMany({
            where: {
                room: {
                    hostelId: hostelId
                },
                status: 'available'
            },
            include: {
                room: {
                    select: { 
                        roomNumber: true, 
                        roomType: true,
                        floor: {
                            select: { floorNumber: true }
                        }
                    }
                }
            },
            orderBy: [
                { roomId: 'asc' },
                { bedNumber: 'asc' }
            ]
        });

        return successResponse(res, beds, "Available beds retrieved successfully", 200);
    } catch (err) {
        console.error("Get Available Beds Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

module.exports = {
    createBed,
    createMultipleBeds,
    getAllBeds,
    getBedsByRoom,
    getBedById,
    updateBed,
    updateBedStatus,
    deleteBed,
    getAvailableBeds
};
