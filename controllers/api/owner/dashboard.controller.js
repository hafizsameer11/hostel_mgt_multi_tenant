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
 * @route   GET /api/owner/dashboard/overview
 * @desc    Get owner's dashboard statistics (only their hostels and related data)
 * @access  Owner
 * @returns {Object} Dashboard data filtered by owner
 */
const getOwnerOverview = async (req, res) => {
    try {
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        // =================== OWNER'S HOSTELS ===================
        const hostels = await prisma.hostel.findMany({
            where: { ownerId },
            select: {
                id: true,
                name: true,
                address: true,
                totalRooms: true,
                totalBeds: true,
                occupiedBeds: true,
                status: true,
                createdAt: true,
                _count: {
                    select: {
                        bookings: true,
                        employees: true,
                        payments: true,
                        allocations: true
                    }
                }
            }
        });

        // =================== HOSTEL STATISTICS ===================
        const hostelStats = {
            total: hostels.length,
            active: hostels.filter(h => h.status === 'active').length,
            inactive: hostels.filter(h => h.status === 'inactive').length,
            totalRooms: hostels.reduce((sum, h) => sum + (h.totalRooms || 0), 0),
            totalBeds: hostels.reduce((sum, h) => sum + (h.totalBeds || 0), 0),
            occupiedBeds: hostels.reduce((sum, h) => sum + (h.occupiedBeds || 0), 0),
            occupancyRate: hostels.reduce((sum, h) => sum + (h.totalBeds || 0), 0) > 0 
                ? ((hostels.reduce((sum, h) => sum + (h.occupiedBeds || 0), 0) / hostels.reduce((sum, h) => sum + (h.totalBeds || 0), 0)) * 100).toFixed(2)
                : 0,
            list: hostels
        };

        // =================== TENANT STATISTICS (Owner's Hostels Only) ===================
        const hostelsIds = hostels.map(h => h.id);
        
        // Get tenants from allocations in owner's hostels
        const allocations = await prisma.allocation.findMany({
            where: {
                room: {
                    hostelId: {
                        in: hostelsIds
                    }
                }
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        status: true,
                        totalPaid: true,
                        totalDue: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        // Extract unique tenants
        const uniqueTenantIds = new Set();
        const tenants = allocations
            .filter(a => a.tenant && !uniqueTenantIds.has(a.tenant.id) && uniqueTenantIds.add(a.tenant.id))
            .map(a => a.tenant);

        const tenantStats = {
            total: tenants.length,
            active: tenants.filter(t => t.status === 'active').length,
            inactive: tenants.filter(t => t.status === 'inactive').length,
            totalPaid: tenants.reduce((sum, t) => sum + (t.totalPaid || 0), 0),
            totalDue: tenants.reduce((sum, t) => sum + (t.totalDue || 0), 0),
            list: tenants
        };

        // =================== BOOKING STATISTICS (Owner's Hostels Only) ===================
        const bookings = await prisma.booking.findMany({
            where: {
                hostelId: {
                    in: hostelsIds
                }
            },
            include: {
                hostel: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const bookingStats = {
            total: bookings.length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            pending: bookings.filter(b => b.status === 'pending').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
            checked_in: bookings.filter(b => b.status === 'checked_in').length,
            checked_out: bookings.filter(b => b.status === 'checked_out').length,
            list: bookings.slice(0, 5) // Latest 5
        };

        // =================== PAYMENT STATISTICS (Owner's Hostels Only) ===================
        const payments = await prisma.payment.findMany({
            where: {
                hostelId: {
                    in: hostelsIds
                }
            },
            include: {
                hostel: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tenant: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                paymentDate: 'desc'
            }
        });

        const paymentStats = {
            total: payments.length,
            paid: payments.filter(p => p.status === 'paid').length,
            pending: payments.filter(p => p.status === 'pending').length,
            partial: payments.filter(p => p.status === 'partial').length,
            overdue: payments.filter(p => p.status === 'overdue').length,
            totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
            totalCollected: payments
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            list: payments.slice(0, 5) // Latest 5
        };

        // =================== EMPLOYEE STATISTICS (Owner's Hostels Only) ===================
        const employees = await prisma.employee.findMany({
            where: {
                hostelId: {
                    in: hostelsIds
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        const employeeStats = {
            total: employees.length,
            active: employees.filter(e => e.status === 'active').length,
            inactive: employees.filter(e => e.status === 'inactive').length,
            totalSalary: employees
                .filter(e => e.status === 'active')
                .reduce((sum, e) => sum + (e.salary || 0), 0),
            list: employees
        };

        return res.status(200).json({
            success: true,
            data: {
                hostels: hostelStats,
                tenants: tenantStats,
                bookings: bookingStats,
                payments: paymentStats,
                employees: employeeStats
            }
        });
    } catch (error) {
        console.error('Error fetching owner dashboard:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/owner/dashboard/activity-log
 * @desc    Get owner's activity logs (only from their hostels' employees)
 * @access  Owner
 * @returns {Array} Activity logs filtered by owner
 */
const getOwnerActivityLog = async (req, res) => {
    try {
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        // Get all hostels owned by this owner
        const hostels = await prisma.hostel.findMany({
            where: { ownerId },
            select: { id: true }
        });

        const hostelIds = hostels.map(h => h.id);

        // Get all employees in these hostels
        const employees = await prisma.employee.findMany({
            where: {
                hostelId: {
                    in: hostelIds
                }
            },
            select: { userId: true }
        });

        const employeeUserIds = employees.map(e => e.userId);

        // Get activity logs only from these employees
        const activityLogs = await prisma.activityLog.findMany({
            where: {
                userId: {
                    in: employeeUserIds
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        return res.status(200).json({
            success: true,
            data: activityLogs
        });
    } catch (error) {
        console.error('Error fetching owner activity logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching activity logs',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/owner/dashboard/stats
 * @desc    Get detailed statistics for owner's hostels
 * @access  Owner
 * @returns {Object} Detailed stats
 */
const getOwnerStats = async (req, res) => {
    try {
        const ownerId = await resolveOwnerId(req.userId);
        if (!ownerId) {
            return res.status(404).json({
                success: false,
                message: 'Owner profile not found for this user'
            });
        }

        // Get owner's hostels
        const hostels = await prisma.hostel.findMany({
            where: { ownerId },
            select: { id: true, name: true }
        });

        const hostelIds = hostels.map(h => h.id);

        // Revenue Stats
        const payments = await prisma.payment.findMany({
            where: {
                hostelId: {
                    in: hostelIds
                },
                status: 'paid'
            }
        });

        const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Occupancy Stats
        const rooms = await prisma.room.findMany({
            where: {
                hostelId: {
                    in: hostelIds
                }
            },
            select: {
                id: true,
                status: true,
                _count: {
                    select: {
                        beds: true
                    }
                }
            }
        });

        const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
        const totalRooms = rooms.length;
        const roomOccupancy = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

        // Pending Payments
        const pendingPayments = await prisma.payment.findMany({
            where: {
                hostelId: {
                    in: hostelIds
                },
                status: {
                    in: ['pending', 'overdue']
                }
            }
        });

        const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        return res.status(200).json({
            success: true,
            data: {
                totalHostels: hostels.length,
                totalRevenue: revenue,
                pendingPayments: pendingAmount,
                roomOccupancy: parseFloat(roomOccupancy),
                totalRooms: totalRooms,
                occupiedRooms: occupiedRooms,
                vacantRooms: totalRooms - occupiedRooms
            }
        });
    } catch (error) {
        console.error('Error fetching owner stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

module.exports = {
    getOwnerOverview,
    getOwnerActivityLog,
    getOwnerStats
};
