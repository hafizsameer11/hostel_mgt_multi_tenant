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
        if (req.isAdmin) {
            return next();
        }

        // Check if user has a role
        if (!req.userRole) {
            return errorResponse(res, "User role not found", 403);
        }

        // Allow owner role to access role management endpoints (for backward compatibility)
        // If checking for admin/manager/staff, also allow owner
        if (req.userRole.roleName === 'owner' && 
            (roleNames.includes('admin') || roleNames.includes('manager') || roleNames.includes('staff'))) {
            // Special case: owner role can access role management
            return next();
        }

        // Check if user's role name matches one of the required roles
        if (!roleNames.includes(req.userRole.roleName)) {
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
    optionalAuth
};
