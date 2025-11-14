// ===============================
// Permission Middleware
// ===============================

const { errorResponse } = require('../Helper/helper');
const { prisma } = require('../config/db');

/**
 * Check if user has permission to perform an action on a resource
 * @param {string} resource - The resource (e.g., "tenants", "owners", "vendors", "users", "user_roles", "api_keys", "prospects")
 * @param {string} action - The action (e.g., "view_list", "view_one", "create", "edit", "delete")
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/tenants', authenticate, checkPermission('tenants', 'view_list'), listTenants);
 * router.post('/tenants', authenticate, checkPermission('tenants', 'create'), createTenant);
 * router.put('/tenants/:id', authenticate, checkPermission('tenants', 'edit'), updateTenant);
 * router.delete('/tenants/:id', authenticate, checkPermission('tenants', 'delete'), deleteTenant);
 */
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user || !req.userId) {
                return errorResponse(res, "Authentication required", 401);
            }

            // Get user with role and permissions
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                include: {
                    userRole: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return errorResponse(res, "User not found", 404);
            }

            // If user is admin, grant all permissions
            if (user.isAdmin) {
                req.userRole = null; // Admin doesn't need a role
                req.userPermissions = []; // Admin has all permissions
                req.isAdmin = true;
                return next();
            }

            // If user has owner role, grant access for role management
            if (user.userRole && user.userRole.roleName && 
                user.userRole.roleName.toLowerCase() === 'owner' && resource === 'user_roles') {
                req.userRole = user.userRole;
                req.userPermissions = []; // Owner has all permissions for role management
                req.isAdmin = false;
                return next();
            }

            // If user has no role, deny access
            if (!user.userRole) {
                return errorResponse(
                    res,
                    "Access denied. No role assigned to user.",
                    403
                );
            }

            // Check if user's role has the required permission
            const hasPermission = user.userRole.permissions.some(
                (rp) =>
                    rp.permission.resource === resource &&
                    rp.permission.action === action
            );

            if (!hasPermission) {
                return errorResponse(
                    res,
                    `Access denied. You don't have permission to ${action} ${resource}.`,
                    403
                );
            }

            // Attach user role and permissions to request for use in controllers
            req.userRole = user.userRole;
            req.userPermissions = user.userRole.permissions.map(rp => ({
                resource: rp.permission.resource,
                action: rp.permission.action,
                permission: `${rp.permission.resource}.${rp.permission.action}`
            }));
            req.isAdmin = false;

            next();
        } catch (err) {
            console.error("Permission Check Error:", err);
            return errorResponse(res, "Error checking permissions", 500);
        }
    };
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<{resource: string, action: string}>} permissions - Array of permission objects
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/dashboard', authenticate, checkAnyPermission([
 *   { resource: 'tenants', action: 'view_list' },
 *   { resource: 'owners', action: 'view_list' }
 * ]), getDashboard);
 */
const checkAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.userId) {
                return errorResponse(res, "Authentication required", 401);
            }

            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                include: {
                    userRole: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return errorResponse(res, "User not found", 404);
            }

            // If user is admin, grant all permissions
            if (user.isAdmin) {
                req.userRole = null;
                req.userPermissions = [];
                req.isAdmin = true;
                return next();
            }

            if (!user.userRole) {
                return errorResponse(res, "Access denied. No role assigned.", 403);
            }

            const userPermissions = user.userRole.permissions.map(
                rp => `${rp.permission.resource}.${rp.permission.action}`
            );

            const hasAnyPermission = permissions.some(
                perm => userPermissions.includes(`${perm.resource}.${perm.action}`)
            );

            if (!hasAnyPermission) {
                return errorResponse(
                    res,
                    "Access denied. Insufficient permissions.",
                    403
                );
            }

            req.userRole = user.userRole;
            req.userPermissions = user.userRole.permissions.map(rp => ({
                resource: rp.permission.resource,
                action: rp.permission.action,
                permission: `${rp.permission.resource}.${rp.permission.action}`
            }));
            req.isAdmin = false;

            next();
        } catch (err) {
            console.error("Permission Check Error:", err);
            return errorResponse(res, "Error checking permissions", 500);
        }
    };
};

/**
 * Check if user has all of the specified permissions
 * @param {Array<{resource: string, action: string}>} permissions - Array of permission objects
 * @returns {Function} Express middleware function
 */
const checkAllPermissions = (permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.userId) {
                return errorResponse(res, "Authentication required", 401);
            }

            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                include: {
                    userRole: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return errorResponse(res, "User not found", 404);
            }

            // If user is admin, grant all permissions
            if (user.isAdmin) {
                req.userRole = null;
                req.userPermissions = [];
                req.isAdmin = true;
                return next();
            }

            if (!user.userRole) {
                return errorResponse(res, "Access denied. No role assigned.", 403);
            }

            const userPermissions = user.userRole.permissions.map(
                rp => `${rp.permission.resource}.${rp.permission.action}`
            );

            const hasAllPermissions = permissions.every(
                perm => userPermissions.includes(`${perm.resource}.${perm.action}`)
            );

            if (!hasAllPermissions) {
                return errorResponse(
                    res,
                    "Access denied. Insufficient permissions.",
                    403
                );
            }

            req.userRole = user.userRole;
            req.userPermissions = user.userRole.permissions.map(rp => ({
                resource: rp.permission.resource,
                action: rp.permission.action,
                permission: `${rp.permission.resource}.${rp.permission.action}`
            }));
            req.isAdmin = false;

            next();
        } catch (err) {
            console.error("Permission Check Error:", err);
            return errorResponse(res, "Error checking permissions", 500);
        }
    };
};

module.exports = {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions
};

