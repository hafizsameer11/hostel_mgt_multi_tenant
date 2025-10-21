// ===============================
// Floor Controller
// ===============================

const { successResponse, errorResponse } = require('../../Helper/helper');
const { prisma } = require('../../config/db');

// ===================================
// CREATE FLOOR
// ===================================
const createFloor = async (req, res) => {
    try {
        const {
            hostel,
            floorNumber,
            floorName,
            description,
            amenities,
            floorPlan
        } = req.body;

        // Validation
        if (!hostel || floorNumber === undefined) {
            return errorResponse(res, "Hostel ID and floor number are required", 400);
        }

        // Check if hostel exists
        const hostelExists = await prisma.hostel.findUnique({
            where: { id: hostel }
        });
        
        if (!hostelExists) {
            return errorResponse(res, "Hostel not found", 404);
        }

        // Check if floor number already exists for this hostel
        const existingFloor = await prisma.floor.findUnique({
            where: {
                hostelId_floorNumber: {
                    hostelId: hostel,
                    floorNumber: floorNumber
                }
            }
        });
        
        if (existingFloor) {
            return errorResponse(res, "Floor number already exists for this hostel", 400);
        }

        // Create floor
        const floor = await prisma.floor.create({
            data: {
                hostelId: hostel,
                floorNumber,
                floorName: floorName || `Floor ${floorNumber}`,
                description: description || null,
                amenities: amenities || [],
                floorPlan: floorPlan || null
            },
            include: {
                hostel: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            }
        });

        // Update hostel's total floors count
        await prisma.hostel.update({
            where: { id: hostel },
            data: {
                totalFloors: { increment: 1 }
            }
        });

        return successResponse(res, floor, "Floor created successfully", 201);
    } catch (err) {
        console.error("Create Floor Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET ALL FLOORS
// ===================================
const getAllFloors = async (req, res) => {
    try {
        const { hostel, status } = req.query;

        // Build filter
        const where = {};
        if (hostel) where.hostelId = hostel;
        if (status) where.status = status;

        const floors = await prisma.floor.findMany({
            where,
            include: {
                hostel: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: [
                { hostelId: 'asc' },
                { floorNumber: 'asc' }
            ]
        });

        return successResponse(res, floors, "Floors retrieved successfully", 200);
    } catch (err) {
        console.error("Get All Floors Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET FLOORS BY HOSTEL
// ===================================
const getFloorsByHostel = async (req, res) => {
    try {
        const { hostelId } = req.params;

        const floors = await prisma.floor.findMany({
            where: { hostelId },
            orderBy: { floorNumber: 'asc' }
        });

        return successResponse(res, floors, "Floors retrieved successfully", 200);
    } catch (err) {
        console.error("Get Floors By Hostel Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// GET FLOOR BY ID
// ===================================
const getFloorById = async (req, res) => {
    try {
        const { id } = req.params;
        const floorId = parseInt(id,10);

        const floor = await prisma.floor.findUnique({
            where: { id: floorId },
            include: {
                hostel: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            }
        });

        if (!floor) {
            return errorResponse(res, "Floor not found", 404);
        }

        // Get rooms on this floor
        const rooms = await prisma.room.findMany({
            where: { floorId: floorId },
            select: {
                id: true,
                roomNumber: true,
                roomType: true,
                status: true,
                totalBeds: true,
                occupiedBeds: true
            }
        });

        const floorData = {
            ...floor,
            rooms
        };

        return successResponse(res, floorData, "Floor retrieved successfully", 200);
    } catch (err) {
        console.error("Get Floor Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// UPDATE FLOOR
// ===================================
const updateFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const floorId = parseInt(id,10);
        // Remove fields that shouldn't be updated directly
        delete updates.hostel;
        delete updates.hostelId;
        delete updates.totalRooms;
        delete updates.totalBeds;
        delete updates.occupiedBeds;

        // Prepare update data
        const updateData = {};
        if (updates.floorNumber !== undefined) updateData.floorNumber = updates.floorNumber;
        if (updates.floorName !== undefined) updateData.floorName = updates.floorName;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
        if (updates.floorPlan !== undefined) updateData.floorPlan = updates.floorPlan;
        if (updates.status !== undefined) updateData.status = updates.status;

        const floor = await prisma.floor.update({
            where: { id: floorId },
            data: updateData,
            include: {
                hostel: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            }
        });

        return successResponse(res, floor, "Floor updated successfully", 200);
    } catch (err) {
        if (err.code === 'P2025') {
            return errorResponse(res, "Floor not found", 404);
        }
        console.error("Update Floor Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

// ===================================
// DELETE FLOOR
// ===================================
const deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;

        const floor = await prisma.floor.findUnique({
            where: { id }
        });
        
        if (!floor) {
            return errorResponse(res, "Floor not found", 404);
        }

        // Check if floor has any rooms
        const roomCount = await prisma.room.count({ where: { floorId: id } });
        if (roomCount > 0) {
            return errorResponse(
                res,
                "Cannot delete floor with existing rooms. Please delete all rooms first.",
                400
            );
        }

        await prisma.floor.delete({
            where: { id }
        });

        // Update hostel's total floors count
        await prisma.hostel.update({
            where: { id: floor.hostelId },
            data: {
                totalFloors: { decrement: 1 }
            }
        });

        return successResponse(res, { id }, "Floor deleted successfully", 200);
    } catch (err) {
        console.error("Delete Floor Error:", err);
        return errorResponse(res, err.message, 400);
    }
};

module.exports = {
    createFloor,
    getAllFloors,
    getFloorsByHostel,
    getFloorById,
    updateFloor,
    deleteFloor
};
