// ===============================
// Bed Controller
// ===============================

const { successResponse, errorResponse } = require('../../Helper/helper');
const { prisma } = require('../../config/db');

const getOwnerIdForRequest = async (req) => {
    // Check role name properly
    const userRoleName = req.userRole?.roleName?.toLowerCase();
    if (userRoleName !== 'owner') return null;
    if (req.ownerId) return req.ownerId;

    const ownerProfile = await prisma.owner.findFirst({
        where: { userId: req.userId },
        select: { id: true }
    });
    req.ownerId = ownerProfile?.id || null;
    return req.ownerId;
};

const getHostelAccessFilter = (ownerId, req) => {
    const userRoleName = req.userRole?.roleName?.toLowerCase();
    if (userRoleName === 'owner' && ownerId) {
        return { ownerId };
    }
    if (userRoleName === 'manager' || userRoleName === 'employee') {
        return { managedBy: req.userId };
    }
    return {};
};

const assertHostelAccess = async (req, hostelId) => {
    const ownerId = await getOwnerIdForRequest(req);
    const userRoleName = req.userRole?.roleName?.toLowerCase();

    const hostel = await prisma.hostel.findUnique({
        where: { id: hostelId },
        select: { id: true, ownerId: true, managedBy: true }
    });

    if (!hostel) {
        return { ok: false, status: 404, message: "Hostel not found" };
    }

    if (userRoleName === 'owner' && (!ownerId || hostel.ownerId !== ownerId)) {
        return { ok: false, status: 403, message: "You are not allowed to manage this hostel" };
    }

    if ((userRoleName === 'manager' || userRoleName === 'employee') && hostel.managedBy !== req.userId) {
        return { ok: false, status: 403, message: "You are not allowed to manage this hostel" };
    }

    return { ok: true, hostel };
};

const assertFloorAccess = async (req, floorId) => {
    const ownerId = await getOwnerIdForRequest(req);
    const userRoleName = req.userRole?.roleName?.toLowerCase();

    const floor = await prisma.floor.findUnique({
        where: { id: floorId },
        include: {
            hostel: {
                select: { id: true, ownerId: true, managedBy: true }
            }
        }
    });

    if (!floor) {
        return { ok: false, status: 404, message: "Floor not found" };
    }

    if (userRoleName === 'owner' && (!ownerId || floor.hostel.ownerId !== ownerId)) {
        return { ok: false, status: 403, message: "You are not allowed to manage this floor" };
    }

    if ((userRoleName === 'manager' || userRoleName === 'employee') && floor.hostel.managedBy !== req.userId) {
        return { ok: false, status: 403, message: "You are not allowed to manage this floor" };
    }

    return { ok: true, floor };
};

const assertRoomAccess = async (req, roomId) => {
    const ownerId = await getOwnerIdForRequest(req);
    const userRoleName = req.userRole?.roleName?.toLowerCase();

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            hostel: { select: { id: true, ownerId: true, managedBy: true } },
            floor: { select: { id: true, hostelId: true } }
        }
    });

    if (!room) {
        return { ok: false, status: 404, message: "Room not found" };
    }

    if (userRoleName === 'owner' && (!ownerId || room.hostel.ownerId !== ownerId)) {
        return { ok: false, status: 403, message: "You are not allowed to manage this room" };
    }

    if ((userRoleName === 'manager' || userRoleName === 'employee') && room.hostel.managedBy !== req.userId) {
        return { ok: false, status: 403, message: "You are not allowed to manage this room" };
    }

    return { ok: true, room };
};

// Helper function to enrich bed with tenant details and lease information
const enrichBedWithTenantDetails = async (bed) => {
    let tenantDetails = null;
    let leaseInfo = null;

    if (bed.currentTenantId) {
        // Find tenant by userId
        const tenant = await prisma.tenant.findFirst({
            where: { userId: bed.currentTenantId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                leaseStartDate: true,
                leaseEndDate: true,
                monthlyRent: true,
                securityDeposit: true,
            }
        });

        if (tenant) {
            tenantDetails = {
                id: tenant.id,
                name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
            };

            // Get lease information from tenant
            leaseInfo = {
                startDate: tenant.leaseStartDate,
                endDate: tenant.leaseEndDate,
                monthlyRent: tenant.monthlyRent,
                securityDeposit: tenant.securityDeposit,
            };

            // Also check active allocation for additional lease info
            const activeAllocation = await prisma.allocation.findFirst({
                where: {
                    tenantId: tenant.id,
                    bedId: bed.id,
                    status: 'active'
                },
                select: {
                    checkInDate: true,
                    expectedCheckOutDate: true,
                    checkOutDate: true,
                    rentAmount: true,
                    depositAmount: true,
                },
                orderBy: { createdAt: 'desc' }
            });

            // Use allocation dates if tenant dates are not available
            if (activeAllocation) {
                if (!leaseInfo.startDate && activeAllocation.checkInDate) {
                    leaseInfo.startDate = activeAllocation.checkInDate;
                }
                if (!leaseInfo.endDate && activeAllocation.expectedCheckOutDate) {
                    leaseInfo.endDate = activeAllocation.expectedCheckOutDate;
                }
                if (!leaseInfo.monthlyRent && activeAllocation.rentAmount) {
                    leaseInfo.monthlyRent = activeAllocation.rentAmount;
                }
                if (!leaseInfo.securityDeposit && activeAllocation.depositAmount) {
                    leaseInfo.securityDeposit = activeAllocation.depositAmount;
                }
            }
        }
    }

    return {
        ...bed,
        tenantDetails,
        leaseInfo,
        // For backward compatibility, also add these fields at the top level
        tenantName: tenantDetails?.name || bed.currentTenant?.username || bed.currentTenant?.email || null,
        leaseStartDate: leaseInfo?.startDate || null,
        leaseEndDate: leaseInfo?.endDate || null,
        rent: leaseInfo?.monthlyRent || null,
    };
};

const assertBedAccess = async (req, bedId) => {
    const ownerId = await getOwnerIdForRequest(req);
    const userRoleName = req.userRole?.roleName?.toLowerCase();

    const bed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: {
            room: { 
                select: { 
                    id: true, 
                    hostelId: true, 
                    floorId: true,
                    hostel: { 
                        select: { 
                            id: true, 
                            ownerId: true, 
                            managedBy: true 
                        } 
                    },
                    floor: { 
                        select: { 
                            id: true, 
                            hostelId: true 
                        } 
                    }
                } 
            }
        }
    });

    if (!bed) {
        return { ok: false, status: 404, message: "Bed not found" };
    }

    if (userRoleName === 'owner' && (!ownerId || bed.room.hostel.ownerId !== ownerId)) {
        return { ok: false, status: 403, message: "You are not allowed to manage this bed" };
    }

    if ((userRoleName === 'manager' || userRoleName === 'employee') && bed.room.hostel.managedBy !== req.userId) {
        return { ok: false, status: 403, message: "You are not allowed to manage this bed" };
    }

    return { ok: true, bed };
};

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
        
        const roomId = parseInt(room, 10);

        // Validation
        if (!Number.isFinite(roomId) || !bedNumber) {
            return errorResponse(res, "Room and bed number are required", 400);
        }

        // Check if room exists
        const roomExists = await prisma.room.findUnique({
            where: { id: roomId }
        });
        
        if (!roomExists) {
            return errorResponse(res, "Room not found", 404);
        }

        const access = await assertRoomAccess(req, roomId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

        // Check if room has reached bed capacity
        const existingBeds = await prisma.bed.count({ where: { roomId: roomId } });
        if (existingBeds >= roomExists.totalBeds) {
            return errorResponse(res, "Room has reached maximum bed capacity", 400);
        }

        // Check if bed number already exists in this room
        const existingBed = await prisma.bed.findUnique({
            where: {
                roomId_bedNumber: {
                    roomId: roomId,
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

        const parsedRoomId = parseInt(roomId, 10);
        const parsedNumberOfBeds = Number(numberOfBeds);

        if (!Number.isFinite(parsedRoomId) || !Number.isFinite(parsedNumberOfBeds)) {
            return errorResponse(res, "Room ID and number of beds are required", 400);
        }

        const room = await prisma.room.findUnique({
            where: { id: parsedRoomId }
        });
        
        if (!room) {
            return errorResponse(res, "Room not found", 404);
        }

        const access = await assertRoomAccess(req, parsedRoomId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

        // Check capacity
        const existingBeds = await prisma.bed.count({ where: { roomId: parsedRoomId } });
        if (existingBeds + parsedNumberOfBeds > room.totalBeds) {
            return errorResponse(res, `Can only create ${room.totalBeds - existingBeds} more beds`, 400);
        }

        // Create beds
        const bedsData = [];
        for (let i = 0; i < parsedNumberOfBeds; i++) {
            bedsData.push({
                roomId: parsedRoomId,
                bedNumber: `${room.roomNumber}-B${startNumber + i}`,
                bedType: bedType || 'single'
            });
        }

        const createdBeds = await prisma.bed.createMany({
            data: bedsData
        });

        return successResponse(res, { count: createdBeds.count }, `${parsedNumberOfBeds} beds created successfully`, 201);
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
            const roomId = parseInt(room, 10);
            if (!Number.isFinite(roomId)) {
                return errorResponse(res, "Invalid room id", 400);
            }
            where.roomId = roomId;
        } else if (floor || hostel) {
            where.room = {};
            if (floor) {
                const floorId = parseInt(floor, 10);
                if (!Number.isFinite(floorId)) {
                    return errorResponse(res, "Invalid floor id", 400);
                }
                where.room.floorId = floorId;
            }
            if (hostel) {
                const hostelId = parseInt(hostel, 10);
                if (!Number.isFinite(hostelId)) {
                    return errorResponse(res, "Invalid hostel id", 400);
                }
                where.room.hostelId = hostelId;
            }
        }
        if (status) where.status = status;

        const ownerId = await getOwnerIdForRequest(req);
        const hostelAccessFilter = getHostelAccessFilter(ownerId, req);
        if (Object.keys(hostelAccessFilter).length > 0) {
            if (!where.room) {
                where.room = {};
            }
            where.room.hostel = hostelAccessFilter;
        }

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
                    select: { username: true, email: true, phone: true, id: true }
                }
            },
            orderBy: [
                { roomId: 'asc' },
                { bedNumber: 'asc' }
            ]
        });

        // Enhance beds with tenant details and lease information
        const bedsWithTenantDetails = await Promise.all(beds.map(bed => enrichBedWithTenantDetails(bed)));

        return successResponse(res, bedsWithTenantDetails, "Beds retrieved successfully", 200);
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
        if (!Number.isFinite(convertRoomId)) {
            return errorResponse(res, "Invalid room id", 400);
        }

        const access = await assertRoomAccess(req, convertRoomId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

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
                    select: { username: true, email: true, phone: true, id: true }
                }
            },
            orderBy: { bedNumber: 'asc' }
        });

        // Enhance beds with tenant details and lease information
        const bedsWithTenantDetails = await Promise.all(beds.map(bed => enrichBedWithTenantDetails(bed)));

        return successResponse(res, bedsWithTenantDetails, "Beds retrieved successfully", 200);
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
        const bedId = parseInt(id,10);
        if (!Number.isFinite(bedId)) {
            return errorResponse(res, "Invalid bed id", 400);
        }

        const access = await assertBedAccess(req, bedId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

        const bed = await prisma.bed.findUnique({
            where: { id: bedId },
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
                    select: { username: true, email: true, phone: true }
                },
                reservedBy: {
                    select: { username: true, email: true, phone: true }
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
        const bedId = parseInt(id,10);
        if (!Number.isFinite(bedId)) {
            return errorResponse(res, "Invalid bed id", 400);
        }

        const access = await assertBedAccess(req, bedId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

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
        if (updates.reservedById !== undefined) {
            if (updates.reservedById === null) {
                updateData.reservedById = null;
            } else {
                const reservedId = Number(updates.reservedById);
                if (!Number.isFinite(reservedId)) {
                    return errorResponse(res, "Invalid reservedById", 400);
                }
                updateData.reservedById = reservedId;
            }
        }
        if (updates.reservationExpiry !== undefined) {
            updateData.reservationExpiry = updates.reservationExpiry ? new Date(updates.reservationExpiry) : null;
        }
        
        if (updates.position) {
            updateData.position = {
                x: updates.position.x || null,
                y: updates.position.y || null
            };
        }

        const bed = await prisma.bed.update({
            where: { id: bedId },
            data: updateData,
            include: {
                room: {
                    select: { roomNumber: true, roomType: true }
                },
                currentTenant: {
                    select: { username: true, email: true }
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
        const bedId = parseInt(id,10);
        if (!Number.isFinite(bedId)) {
            return errorResponse(res, "Invalid bed id", 400);
        }
        const { status } = req.body;

        if (!['available', 'occupied', 'reserved', 'under_maintenance'].includes(status)) {
            return errorResponse(res, "Invalid status", 400);
        }

        const access = await assertBedAccess(req, bedId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

        const bed = await prisma.bed.update({
            where: { id: bedId },
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
        const bedId = parseInt(id,10);
        if (!Number.isFinite(bedId)) {
            return errorResponse(res, "Invalid bed id", 400);
        }

        const access = await assertBedAccess(req, bedId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

        const bed = await prisma.bed.findUnique({
            where: { id: bedId }
        });
        
        if (!bed) {
            return errorResponse(res, "Bed not found", 404);
        }

        // Check if bed is occupied
        if (bed.status === 'occupied' || bed.currentTenantId) {
            return errorResponse(res, "Cannot delete occupied bed. Please deallocate tenant first.", 400);
        }

        await prisma.bed.delete({
            where: { id: bedId }
        });

        return successResponse(res, { id: bedId }, "Bed deleted successfully", 200);
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
        const parsedHostelId = parseInt(hostelId, 10);
        if (!Number.isFinite(parsedHostelId)) {
            return errorResponse(res, "Invalid hostel id", 400);
        }

        const access = await assertHostelAccess(req, parsedHostelId);
        if (!access.ok) {
            return errorResponse(res, access.message, access.status);
        }

        const beds = await prisma.bed.findMany({
            where: {
                room: {
                    hostelId: parsedHostelId
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
