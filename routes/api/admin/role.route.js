// ===============================
// Role Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    updateRolePermissions
} = require('../../../controllers/api/role.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');
const { checkPermission } = require('../../../middleware/permission.middleware');
const { prisma } = require('../../../config/db');
const { errorResponse } = require('../../../Helper/helper');

// All routes require authentication
router.use(authenticate);

// Helper middleware: Check permission OR allow admin/owner
const checkPermissionOrAdminOrOwner = (resource, action) => {
    return async (req, res, next) => {
        try {
            // If user is admin (isAdmin flag), allow access
            if (req.isAdmin) {
                return next();
            }
            
            // Ensure userRole is loaded if not already set
            if (!req.userRole && req.userId) {
                const user = await prisma.user.findUnique({
                    where: { id: req.userId },
                    include: {
                        userRole: {
                            select: {
                                id: true,
                                roleName: true,
                                description: true
                            }
                        }
                    }
                });
                
                if (user && user.userRole) {
                    req.userRole = user.userRole;
                }
            }
            
            // If user has owner role, allow access (bypass permission check)
            // Check case-insensitively just to be safe
            if (req.userRole && req.userRole.roleName && 
                req.userRole.roleName.toLowerCase() === 'owner') {
                // Set isAdmin flag to false but allow access
                req.isAdmin = false;
                req.userPermissions = []; // Owner has all permissions for role management
                return next();
            }
            
            // Otherwise check permission
            return checkPermission(resource, action)(req, res, next);
        } catch (err) {
            console.error("Permission Check Error:", err);
            return errorResponse(res, "Error checking permissions", 500);
        }
    };
};

// Get all roles
router.get(
    '/roles',
    checkPermissionOrAdminOrOwner('user_roles', 'view_list'),
    getAllRoles
);

// Get role by ID
router.get(
    '/role/:id',
    checkPermissionOrAdminOrOwner('user_roles', 'view_one'),
    getRoleById
);

// Create role
router.post(
    '/role',
    checkPermissionOrAdminOrOwner('user_roles', 'create'),
    createRole
);

// Update role
router.put(
    '/role/:id',
    checkPermissionOrAdminOrOwner('user_roles', 'edit'),
    updateRole
);

// Delete role
router.delete(
    '/role/:id',
    checkPermissionOrAdminOrOwner('user_roles', 'delete'),
    deleteRole
);

// Get role permissions
router.get(
    '/role/:id/permissions',
    checkPermissionOrAdminOrOwner('user_roles', 'view_one'),
    getRolePermissions
);

// Update role permissions
router.put(
    '/role/:id/permissions',
    checkPermissionOrAdminOrOwner('user_roles', 'edit'),
    updateRolePermissions
);

module.exports = router;

