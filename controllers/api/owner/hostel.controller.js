const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const resolveOwnerId = async (userId) => {
    const ownerProfile = await prisma.owner.findFirst({
        where: { userId },
        select: { id: true }
    });
    return ownerProfile?.id || null;
};

/**
 * @route   GET /api/owner/hostels
 * @desc    Get all hostels owned by the authenticated owner
 * @access  Owner
 * @returns {Array} List of owner's hostels
 */
const getOwnerHostels = async (req, res) => {
    try {
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        const hostels = await prisma.hostel.findMany({
            where: { ownerId },
            include: {
                _count: {
                    select: {
                        rooms: true,
                        allocations: true,
                        bookings: true,
                        employees: true,
                        payments: true
                    }
                },
                rooms: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Add calculated fields
        const hostelsWithStats = hostels.map(hostel => ({
            ...hostel,
            occupancyRate: hostel.totalBeds > 0 ? ((hostel.occupiedBeds / hostel.totalBeds) * 100).toFixed(2) : 0,
            occupiedRooms: hostel.rooms.filter(r => r.status === 'occupied').length,
            vacantRooms: hostel.rooms.filter(r => r.status === 'vacant').length
        }));

        return res.status(200).json({
            success: true,
            data: hostelsWithStats
        });
    } catch (error) {
        console.error('Error fetching owner hostels:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching hostels',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/owner/hostels/:id
 * @desc    Get detailed information of a specific hostel
 * @access  Owner
 * @returns {Object} Hostel details
 */
const getOwnerHostelDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        const hostel = await prisma.hostel.findUnique({
            where: { id: parseInt(id) },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                floors: {
                    select: {
                        id: true,
                        floorName: true,
                        status: true
                    }
                },
                rooms: {
                    select: {
                        id: true,
                        roomNumber: true,
                        roomType: true,
                        status: true,
                        _count: {
                            select: {
                                beds: true,
                                allocations: true
                            }
                        }
                    }
                },
                employees: {
                    select: {
                        id: true,
                        employeeCode: true,
                        designation: true,
                        user: {
                            select: {
                                username: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        bookings: true,
                        allocations: true,
                        payments: true
                    }
                }
            }
        });

        // Verify ownership
        if (!hostel || hostel.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this hostel'
            });
        }

        return res.status(200).json({
            success: true,
            data: hostel
        });
    } catch (error) {
        console.error('Error fetching hostel details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching hostel details',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/owner/hostels/:id
 * @desc    Update owner's hostel details
 * @access  Owner
 * @returns {Object} Updated hostel
 */
const updateOwnerHostel = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }
        const { name, address, description, amenities, status, contactInfo, operatingHours } = req.body;

        // Verify ownership
        const hostel = await prisma.hostel.findUnique({
            where: { id: parseInt(id) },
            select: { ownerId: true }
        });

        if (!hostel || hostel.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this hostel'
            });
        }

        const updatedHostel = await prisma.hostel.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(address && { address: JSON.parse(address) }),
                ...(description && { description }),
                ...(amenities && { amenities: JSON.parse(amenities) }),
                ...(status && { status }),
                ...(contactInfo && { contactInfo: JSON.parse(contactInfo) }),
                ...(operatingHours && { operatingHours: JSON.parse(operatingHours) })
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Hostel updated successfully',
            data: updatedHostel
        });
    } catch (error) {
        console.error('Error updating hostel:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating hostel',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/owner/hostels/:id/bookings
 * @desc    Get all bookings for a specific hostel
 * @access  Owner
 * @returns {Array} Bookings for the hostel
 */
const getOwnerHostelBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        // Verify ownership
        const hostel = await prisma.hostel.findUnique({
            where: { id: parseInt(id) },
            select: { ownerId: true }
        });

        if (!hostel || hostel.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this hostel'
            });
        }

        const bookings = await prisma.booking.findMany({
            where: { hostelId: parseInt(id) },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                allocation: {
                    select: {
                        id: true,
                        room: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching hostel bookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/owner/hostels/:id/employees
 * @desc    Get all employees assigned to a hostel
 * @access  Owner
 * @returns {Array} Employees
 */
const getOwnerHostelEmployees = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        // Verify ownership
        const hostel = await prisma.hostel.findUnique({
            where: { id: parseInt(id) },
            select: { ownerId: true }
        });

        if (!hostel || hostel.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this hostel'
            });
        }

        const employees = await prisma.employee.findMany({
            where: { hostelId: parseInt(id) },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: employees
        });
    } catch (error) {
        console.error('Error fetching hostel employees:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching employees',
            error: error.message
        });
    }
};

module.exports = {
    getOwnerHostels,
    getOwnerHostelDetails,
    updateOwnerHostel,
    getOwnerHostelBookings,
    getOwnerHostelEmployees
};
