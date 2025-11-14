// ===============================
// Permission Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    getAllPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
    getPermissionsByResource,
    getAllResources,
    getAllActions,
    bulkCreatePermissions
} = require('../../../controllers/api/permission.controller');
const { authenticate } = require('../../../middleware/auth.middleware');
const { checkPermission } = require('../../../middleware/permission.middleware');

// All routes require authentication
router.use(authenticate);

// Helper middleware: Check permission OR allow admin (isAdmin flag)
const checkPermissionOrAdmin = (resource, action) => {
    return async (req, res, next) => {
        // If user is admin (isAdmin flag), allow access
        if (req.isAdmin) {
            return next();
        }
        // Otherwise check permission
        return checkPermission(resource, action)(req, res, next);
    };
};

// Get all permissions
router.get(
    '/permissions',
    checkPermissionOrAdmin('user_roles', 'view_list'),
    getAllPermissions
);

// Get permission by ID
router.get(
    '/permission/:id',
    checkPermissionOrAdmin('user_roles', 'view_one'),
    getPermissionById
);

// Create permission
router.post(
    '/permission',
    checkPermissionOrAdmin('user_roles', 'create'),
    createPermission
);

// Update permission
router.put(
    '/permission/:id',
    checkPermissionOrAdmin('user_roles', 'edit'),
    updatePermission
);

// Delete permission
router.delete(
    '/permission/:id',
    checkPermissionOrAdmin('user_roles', 'delete'),
    deletePermission
);

// Get permissions by resource
router.get(
    '/permissions/resource/:resource',
    checkPermissionOrAdmin('user_roles', 'view_list'),
    getPermissionsByResource
);

// Get all resources
router.get(
    '/permissions/resources',
    checkPermissionOrAdmin('user_roles', 'view_list'),
    getAllResources
);

// Get all actions
router.get(
    '/permissions/actions',
    checkPermissionOrAdmin('user_roles', 'view_list'),
    getAllActions
);

// Bulk create permissions
router.post(
    '/permissions/bulk',
    checkPermissionOrAdmin('user_roles', 'create'),
    bulkCreatePermissions
);

module.exports = router;

