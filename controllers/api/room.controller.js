// ===============================
// Room Controller
// ===============================

const { successResponse, errorResponse } = require('../../Helper/helper');
const { prisma } = require('../../config/db');

// ===================================
// CREATE ROOM
// ===================================
const createRoom = async (req, res) => {
    try {
        const {
            hostel,
            floor,
            roomNumber,
            roomType,
            totalBeds,
            pricePerBed,
            amenities,
            hasAttachedBathroom,
            furnishing,
        } = req.body;

        // Validation
        if (!hostel || !floor || !roomNumber || !roomType || !totalBeds || pricePerBed === undefined) {
            return errorResponse(res, "Hostel, floor, room number, room type, total beds, and price are required", 400);
        }

        // Check if floor exists
        const floorExists = await prisma.floor.findUnique({
            where: { id: floor }
        });
        
        if (!floorExists) {
            return errorResponse(res, "Floor not found", 404);
        }

        // Check if room number already exists for this hostel
        const existingRoom = await prisma.room.findUnique({
            where: {
                hostelId_roomNumber: {
                    hostelId: hostel,
                    roomNumber: roomNumber
                }
            }
        });
        
        if (existingRoom) {
            return errorResponse(res, "Room number already exists for this hostel", 400);
        }

        // Create room
        const room = await prisma.room.create({
            data: {
                hostelId: hostel,
                floorId: floor,
                roomNumber,
                roomType,
                totalBeds,
                pricePerBed,
                amenities: amenities || [],
                // dimensions: dimensions ? {
                //     length: dimensions.length || null,
                //     width: dimensions.width || null,
                //     area: dimensions.area || null
                // } : null,
                hasAttachedBathroom: hasAttachedBathroom || false,
                // hasBalcony: hasBalcony || false,
                furnishing: furnishing || 'furnished',
                // images: images || []
            },
            include: {
                hostel: {
                    select: { name: true }
                },
                floor: {
                    select: { floorNumber: true, floorName: true }
                }
            }
        });

        // Update floor and hostel counts
        await Promise.all([
            prisma.floor.update({
                where: { id: floor },
                data: {
                    totalRooms: { increment: 1 },
                    totalBeds: { increment: totalBeds }
                }
            }),
            prisma.hostel.update({
                where: { id: hostel },
                data: {
                    totalRooms: { increment: 1 },
                    totalBeds: { increment: totalBeds }
                }
            })
        ]);

        return successResponse(res, room, "Room created successfully", 201);
    } catch (err) {
        console.error("Create Room Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ALL ROOMS
// ===================================
const getAllRooms = async (req, res) => {
    try {
        const { hostel, floor, status, roomType, page = 1, limit = 20 } = req.query;

        // Build filter
        const where = {};
        if (hostel) where.hostelId = hostel;
        if (floor) where.floorId = floor;
        if (status) where.status = status;
        if (roomType) where.roomType = roomType;

        // Pagination
        const skip = (page - 1) * limit;

        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where,
                include: {
                    hostel: {
                        select: { name: true }
                    },
                    floor: {
                        select: { floorNumber: true, floorName: true }
                    }
                },
                orderBy: { roomNumber: 'asc' },
                take: parseInt(limit),
                skip: skip
            }),
            prisma.room.count({ where })
        ]);

        return successResponse(res, {
            rooms,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        }, "Rooms retrieved successfully", 200);
    } catch (err) {
        console.error("Get All Rooms Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ROOMS BY HOSTEL
// ===================================
const getRoomsByHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const { status } = req.query;
        const convertedHostelId = parseInt(hostelId,10);
        const where = { hostelId: convertedHostelId };
        if (status) where.status = status;

        const rooms = await prisma.room.findMany({
            where,
            include: {
                floor: {
                    select: { floorNumber: true, floorName: true }
                }
            },
            orderBy: [
                { floorId: 'asc' },
                { roomNumber: 'asc' }
            ]
        });

        return successResponse(res, rooms, "Rooms retrieved successfully", 200);
    } catch (err) {
        console.error("Get Rooms By Hostel Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ROOMS BY FLOOR
// ===================================
const getRoomsByFloor = async (req, res) => {
    try {
        const { floorId } = req.params;
        const convertedFloorId = parseInt(floorId,10);
        const rooms = await prisma.room.findMany({
            where: { floorId: convertedFloorId },
            include: {
                hostel: {
                    select: { name: true }
                }
            },
            orderBy: { roomNumber: 'asc' }
        });

        return successResponse(res, rooms, "Rooms retrieved successfully", 200);
    } catch (err) {
        console.error("Get Rooms By Floor Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ROOM BY ID
// ===================================
const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id,10);

        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                hostel: {
                    select: { name: true, address: true, contactInfo: true }
                },
                floor: {
                    select: { floorNumber: true, floorName: true }
                }
            }
        });

        if (!room) {
            return errorResponse(res, "Room not found", 404);
        }

        // Get beds in this room
        const beds = await prisma.bed.findMany({
            where: { roomId: roomId },
            include: {
                currentTenant: {
                    select: { name: true, email: true, phone: true }
                }
            }
        });

        const roomData = {
            ...room,
            beds,
            availableBeds: room.totalBeds - room.occupiedBeds,
            isFullyOccupied: room.occupiedBeds >= room.totalBeds
        };

        return successResponse(res, roomData, "Room retrieved successfully", 200);
    } catch (err) {
        console.error("Get Room Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// UPDATE ROOM
// ===================================
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const roomId = parseInt(id,10);

        // Remove fields that shouldn't be updated directly
        delete updates.hostel;
        delete updates.hostelId;
        delete updates.floor;
        delete updates.floorId;
        delete updates.occupiedBeds;

        const oldRoom = await prisma.room.findUnique({
            where: { id: roomId }
        });
        
        if (!oldRoom) {
            return errorResponse(res, "Room not found", 404);
        }

        // Prepare update data
        const updateData = {};
        if (updates.roomNumber) updateData.roomNumber = updates.roomNumber;
        if (updates.roomType) updateData.roomType = updates.roomType;
        if (updates.totalBeds !== undefined) updateData.totalBeds = updates.totalBeds;
        if (updates.pricePerBed !== undefined) updateData.pricePerBed = updates.pricePerBed;
        if (updates.status) updateData.status = updates.status;
        if (updates.amenities) updateData.amenities = updates.amenities;
        if (updates.hasAttachedBathroom !== undefined) updateData.hasAttachedBathroom = updates.hasAttachedBathroom;
        if (updates.hasBalcony !== undefined) updateData.hasBalcony = updates.hasBalcony;
        if (updates.furnishing) updateData.furnishing = updates.furnishing;
        if (updates.images) updateData.images = updates.images;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        
        if (updates.dimensions) {
            updateData.dimensions = {
                length: updates.dimensions.length || null,
                width: updates.dimensions.width || null,
                area: updates.dimensions.area || null
            };
        }

        const room = await prisma.room.update({
            where: { id: roomId },
            data: updateData,
            include: {
                hostel: {
                    select: { name: true }
                },
                floor: {
                    select: { floorNumber: true, floorName: true }
                }
            }
        });

        // If total beds changed, update floor and hostel counts
        if (updates.totalBeds && updates.totalBeds !== oldRoom.totalBeds) {
            const difference = updates.totalBeds - oldRoom.totalBeds;
            
            await Promise.all([
                prisma.floor.update({
                    where: { id: oldRoom.floorId },
                    data: {
                        totalBeds: { increment: difference }
                    }
                }),
                prisma.hostel.update({
                    where: { id: oldRoom.hostelId },
                    data: {
                        totalBeds: { increment: difference }
                    }
                })
            ]);
        }

        return successResponse(res, room, "Room updated successfully", 200);
    } catch (err) {
        console.error("Update Room Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// UPDATE ROOM STATUS
// ===================================
const updateRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const roomId = parseInt(id,10);

        if (!['vacant', 'occupied', 'under_maintenance', 'reserved'].includes(status)) {
            return errorResponse(res, "Invalid status", 400);
        }

        const room = await prisma.room.update({
            where: { id: roomId },
            data: { status },
            include: {
                hostel: {
                    select: { name: true }
                },
                floor: {
                    select: { floorNumber: true, floorName: true }
                }
            }
        });

        return successResponse(res, room, "Room status updated successfully", 200);
    } catch (err) {
        if (err.code === 'P2025') {
            return errorResponse(res, "Room not found", 404);
        }
        console.error("Update Room Status Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// SCHEDULE MAINTENANCE
// ===================================
const scheduleMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description } = req.body;

        if (!date || !description) {
            return errorResponse(res, "Date and description are required", 400);
        }

        // Get current room data
        const currentRoom = await prisma.room.findUnique({
            where: { id }
        });

        if (!currentRoom) {
            return errorResponse(res, "Room not found", 404);
        }

        // Add new maintenance schedule
        const updatedSchedule = [
            ...(currentRoom.maintenanceSchedule || []),
            {
                date: new Date(date),
                description,
                status: 'scheduled'
            }
        ];

        const room = await prisma.room.update({
            where: { id },
            data: {
                maintenanceSchedule: updatedSchedule
            }
        });

        return successResponse(res, room, "Maintenance scheduled successfully", 200);
    } catch (err) {
        console.error("Schedule Maintenance Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// DELETE ROOM
// ===================================
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await prisma.room.findUnique({
            where: { id }
        });
        
        if (!room) {
            return errorResponse(res, "Room not found", 404);
        }

        // Check if room has any beds
        const bedCount = await prisma.bed.count({ where: { roomId: id } });
        if (bedCount > 0) {
            return errorResponse(
                res,
                "Cannot delete room with existing beds. Please delete all beds first.",
                400
            );
        }

        await prisma.room.delete({
            where: { id }
        });

        // Update floor and hostel counts
        await Promise.all([
            prisma.floor.update({
                where: { id: room.floorId },
                data: {
                    totalRooms: { decrement: 1 },
                    totalBeds: { decrement: room.totalBeds }
                }
            }),
            prisma.hostel.update({
                where: { id: room.hostelId },
                data: {
                    totalRooms: { decrement: 1 },
                    totalBeds: { decrement: room.totalBeds }
                }
            })
        ]);

        return successResponse(res, { id }, "Room deleted successfully", 200);
    } catch (err) {
        console.error("Delete Room Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

module.exports = {
    createRoom,
    getAllRooms,
    getRoomsByHostel,
    getRoomsByFloor,
    getRoomById,
    updateRoom,
    updateRoomStatus,
    scheduleMaintenance,
    deleteRoom
};
