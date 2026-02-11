// ===============================
// Authentication Middleware
// ===============================

const { verifyToken } = require('../Helper/jwt.helper');
const { errorResponse } = require('../Helper/helper');
const { prisma } = require('../config/db');

/**
 * Note: Role-based authorization is now handled through the Permission system.
 * The authorize() function below is kept for backward compatibility but should
 * be replaced with checkPermission() middleware for new routes.
 */

/**
 * Verify JWT Token Middleware
 * Checks for token in cookies or Authorization header
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies.token;

        // If not in cookie, check Authorization header
        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.substring(7);
            }
        }

        // Check if token exists
        if (!token) {
            return errorResponse(res, "Authentication required. Please login.", 401);
        }

        // Verify token
        const decoded = verifyToken(token);

        // Get user from database using Prisma with role and permissions
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
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
            return errorResponse(res, "User not found. Please login again.", 401);
        }

        // Check if user is active (status defaults to 'active' but can be null)
        if (user.status && user.status !== 'active') {
            return errorResponse(res, "Your account is inactive. Please contact support.", 403);
        }

        // Extract user data for response (without sensitive info)
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            status: user.status,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.userRole ? {
                id: user.userRole.id,
                name: user.userRole.roleName,
                description: user.userRole.description
            } : null
        };

        // Extract permissions for easy access
        const userPermissions = user.userRole
            ? user.userRole.permissions.map(rp => ({
                  resource: rp.permission.resource,
                  action: rp.permission.action,
                  permission: `${rp.permission.resource}.${rp.permission.action}`
              }))
            : [];

        // Attach user to request object
        req.user = userData;
        req.userId = user.id;
        req.isAdmin = user.isAdmin;
        req.userRole = user.userRole;
        req.userRoleName = user.userRole?.roleName?.toLowerCase() || null; // Set role name for access filters
        req.userPermissions = userPermissions;

        next();
    } catch (err) {
        console.error("Authentication Error:", err);
        return errorResponse(res, "Invalid or expired token. Please login again.", 401);
    }
};

/**
 * Check if user has required role (by role name)
 * Note: This is for backward compatibility. For new routes, use checkPermission() middleware.
 * @param {...string} roleNames - Allowed role names (e.g., authorize('admin', 'manager'))
 * @example
 * router.get('/route', authenticate, authorize('admin', 'owner'), handler);
 */
const authorize = (...roleNames) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        // If user is admin (isAdmin flag), allow access regardless of role
        // Admin can see everything
        if (req.isAdmin) {
            return next();
        }

        // Check if user has a role
        if (!req.userRole) {
            return errorResponse(res, "User role not found", 403);
        }

        const userRoleName = req.userRole.roleName?.toLowerCase();

        // Owner role should only access owner-specific routes
        // Don't allow owner to access admin routes unless explicitly allowed
        if (userRoleName === 'owner') {
            // Only allow if 'owner' is explicitly in the allowed roles
            if (roleNames.includes('owner')) {
                return next();
            }
            // Deny access to admin routes for owner
            return errorResponse(
                res,
                "Access denied. Owner role cannot access this resource.",
                403
            );
        }

        // For employees (manager, staff, employee), check if their role name matches
        // Note: For permission-based access, use authorizeWithPermission instead
        // Convert both to lowercase for case-insensitive comparison
        const userRoleNameLower = req.userRole.roleName?.toLowerCase();
        const allowedRoleNamesLower = roleNames.map(r => r.toLowerCase());
        
        if (!allowedRoleNamesLower.includes(userRoleNameLower)) {
            return errorResponse(
                res,
                `Access denied. This action requires ${roleNames.join(' or ')} role. Your role: ${req.userRole.roleName}`,
                403
            );
        }

        next();
    };
};

/**
 * Enhanced authorization for admin routes
 * - Admin (isAdmin) can access everything
 * - Owner cannot access admin routes
 * - Employees are checked by permissions
 * @param {string} resource - Resource name for permission check
 * @param {string} action - Action name for permission check
 * @example
 * router.get('/route', authenticate, authorizeAdminRoute('tenants', 'view_list'), handler);
 */
const authorizeAdminRoute = (resource, action) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        // Admin can see everything - no restrictions
        if (req.isAdmin) {
            return next();
        }

        // Owner can access admin routes (data will be filtered by their hostels in controllers)
        if (req.userRole && req.userRole.roleName?.toLowerCase() === 'owner') {
            // Owner has full feature access, but data will be filtered
            return next();
        }

        // For employees, check permissions
        if (!req.userRole) {
            return errorResponse(res, "User role not found", 403);
        }

        // Check if user has the required permission
        const hasPermission = req.userPermissions.some(
            perm => perm.resource === resource && perm.action === action
        );

        if (!hasPermission) {
            return errorResponse(
                res,
                `Access denied. You don't have permission to ${action} ${resource}.`,
                403
            );
        }

        next();
    };
};

/**
 * Authorization for owner routes only
 * - Only allows owner role
 * - Admin can also access (for management purposes)
 * @example
 * router.get('/route', authenticate, authorizeOwnerRoute(), handler);
 */
const authorizeOwnerRoute = () => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        // Admin can access owner routes for management
        if (req.isAdmin) {
            return next();
        }

        // Check if user has owner role
        if (!req.userRole) {
            return errorResponse(res, "User role not found", 403);
        }

        const userRoleName = req.userRole.roleName?.toLowerCase();
        if (userRoleName !== 'owner') {
            return errorResponse(
                res,
                `Access denied. This route requires owner role. Your role: ${req.userRole.roleName}`,
                403
            );
        }

        next();
    };
};

/**
 * Authorization for admin routes that owner can also access (read-only, filtered by their hostels)
 * - Admin: Full access
 * - Owner: Read access (will be filtered by their hostels in controllers)
 * - Employee: Based on role
 * @example
 * router.get('/route', authenticate, authorizeAdminOrOwner(), handler);
 */
const authorizeAdminOrOwner = () => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        // Admin can access everything
        if (req.isAdmin) {
            return next();
        }

        // Owner can access (will be filtered by their hostels)
        if (req.userRole && req.userRole.roleName?.toLowerCase() === 'owner') {
            return next();
        }

        // Employees can access based on role
        return authorize('admin', 'manager', 'staff')(req, res, next);
    };
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for routes that work differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies.token;

        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.substring(7);
            }
        }

        if (token) {
            const decoded = verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
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
            
            if (user && user.status === 'active') {
                const userData = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    isAdmin: user.isAdmin,
                    role: user.userRole ? {
                        id: user.userRole.id,
                        name: user.userRole.roleName,
                        description: user.userRole.description
                    } : null
                };

                const userPermissions = user.userRole
                    ? user.userRole.permissions.map(rp => ({
                          resource: rp.permission.resource,
                          action: rp.permission.action,
                          permission: `${rp.permission.resource}.${rp.permission.action}`
                      }))
                    : [];

                req.user = userData;
                req.userId = user.id;
                req.isAdmin = user.isAdmin;
                req.userRole = user.userRole;
                req.userPermissions = userPermissions;
            }
        }

        next();
    } catch (err) {
        // Don't fail, just continue without user
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    authorizeAdminRoute,
    authorizeOwnerRoute,
    authorizeAdminOrOwner,
    optionalAuth
};
