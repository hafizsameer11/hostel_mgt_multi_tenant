// ===============================
// Role-Based Access Control Middleware
// ===============================

const { errorResponse } = require('../Helper/helper');
const { prisma } = require('../config/db');

/**
 * Get the user's role type (admin, owner, employee, user)
 * @param {Object} user - User object from authenticate middleware
 * @returns {string} - Role type
 */
const getUserRoleType = (user) => {
    // Check if super admin
    if (user.isAdmin) {
        return 'admin';
    }
    
    // Check role name
    if (user.role && user.role.name) {
        const roleName = user.role.name.toLowerCase();
        if (roleName === 'owner') return 'owner';
        if (roleName === 'employee' || roleName === 'staff' || roleName === 'manager') return 'employee';
    }
    
    return 'user';
};

/**
 * Add query filters based on user role
 * Admin: No filters (see all)
 * Owner: Filter by ownerId from ownerProfile
 * Employee: Filter by permissions and assigned hostels
 * User: Filter by userId (own data only)
 */
const addRoleBasedFilters = async (req, res, next) => {
    try {
        if (!req.user || !req.userId) {
            return errorResponse(res, "Authentication required", 401);
        }

        const roleType = getUserRoleType(req.user);
        req.roleType = roleType;

        // Admin sees everything - no filters
        if (roleType === 'admin') {
            req.dataFilters = {};
            return next();
        }

        // Owner - get their owner profile and filter by their hostels
        if (roleType === 'owner') {
            const ownerProfile = await prisma.owner.findUnique({
                where: { userId: req.userId },
                include: {
                    hostels: {
                        select: { id: true }
                    }
                }
            });

            if (!ownerProfile) {
                return errorResponse(res, "Owner profile not found", 404);
            }

            req.ownerProfile = ownerProfile;
            req.dataFilters = {
                ownerId: ownerProfile.id,
                hostelIds: ownerProfile.hostels.map(h => h.id)
            };
            return next();
        }

        // Employee - filter by their assigned hostel and permissions
        if (roleType === 'employee') {
            const employeeProfile = await prisma.employee.findUnique({
                where: { userId: req.userId },
                include: {
                    hostel: {
                        select: { id: true, ownerId: true }
                    }
                }
            });

            if (!employeeProfile) {
                return errorResponse(res, "Employee profile not found", 404);
            }

            req.employeeProfile = employeeProfile;
            req.dataFilters = {
                hostelId: employeeProfile.hostelId,
                hostelIds: employeeProfile.hostelId ? [employeeProfile.hostelId] : []
            };
            return next();
        }

        // Regular user - only see their own data
        req.dataFilters = {
            userId: req.userId
        };

        next();
    } catch (err) {
        console.error("Role Filter Error:", err);
        return errorResponse(res, "Error applying role-based filters", 500);
    }
};

/**
 * Require specific role type
 * @param {...string} allowedRoles - Array of allowed role types: 'admin', 'owner', 'employee', 'user'
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        const roleType = getUserRoleType(req.user);
        req.roleType = roleType;

        if (!allowedRoles.includes(roleType)) {
            return errorResponse(
                res,
                `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${roleType}`,
                403
            );
        }

        next();
    };
};

/**
 * Check if user can access a specific hostel
 */
const canAccessHostel = (hostelId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        const roleType = getUserRoleType(req.user);

        // Admin can access all hostels
        if (roleType === 'admin') {
            return next();
        }

        // Owner - check if hostel belongs to them
        if (roleType === 'owner') {
            const ownerProfile = await prisma.owner.findUnique({
                where: { userId: req.userId },
                include: {
                    hostels: {
                        where: { id: parseInt(hostelId) }
                    }
                }
            });

            if (!ownerProfile || ownerProfile.hostels.length === 0) {
                return errorResponse(res, "Access denied. You don't own this hostel.", 403);
            }

            return next();
        }

        // Employee - check if assigned to this hostel
        if (roleType === 'employee') {
            const employeeProfile = await prisma.employee.findUnique({
                where: { userId: req.userId }
            });

            if (!employeeProfile || employeeProfile.hostelId !== parseInt(hostelId)) {
                return errorResponse(res, "Access denied. You are not assigned to this hostel.", 403);
            }

            return next();
        }

        return errorResponse(res, "Access denied", 403);
    };
};

/**
 * Apply hostel-based filtering to query
 * Modifies the query object to include hostel filters based on user role
 */
const applyHostelFilter = (query = {}) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        const roleType = getUserRoleType(req.user);

        // Admin - no filter
        if (roleType === 'admin') {
            req.hostelQuery = query;
            return next();
        }

        // Owner - filter by their hostels
        if (roleType === 'owner') {
            const ownerProfile = await prisma.owner.findUnique({
                where: { userId: req.userId },
                include: {
                    hostels: {
                        select: { id: true }
                    }
                }
            });

            if (!ownerProfile) {
                return errorResponse(res, "Owner profile not found", 404);
            }

            const hostelIds = ownerProfile.hostels.map(h => h.id);
            req.hostelQuery = {
                ...query,
                id: { in: hostelIds }
            };
            return next();
        }

        // Employee - filter by assigned hostel
        if (roleType === 'employee') {
            const employeeProfile = await prisma.employee.findUnique({
                where: { userId: req.userId }
            });

            if (!employeeProfile || !employeeProfile.hostelId) {
                req.hostelQuery = {
                    ...query,
                    id: -1 // No hostel access
                };
                return next();
            }

            req.hostelQuery = {
                ...query,
                id: employeeProfile.hostelId
            };
            return next();
        }

        // Regular user - no hostel access
        req.hostelQuery = {
            ...query,
            id: -1
        };

        next();
    };
};

module.exports = {
    getUserRoleType,
    addRoleBasedFilters,
    requireRole,
    canAccessHostel,
    applyHostelFilter
};
