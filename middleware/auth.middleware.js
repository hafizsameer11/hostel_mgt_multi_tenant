// ===============================
// Authentication Middleware
// ===============================

const { verifyToken } = require('../Helper/jwt.helper');
const { errorResponse } = require('../Helper/helper');
const { prisma } = require('../config/db');

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

        // Get user from database using Prisma
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return errorResponse(res, "User not found. Please login again.", 401);
        }

        // Check if user is active
        if (user.status !== 'active') {
            return errorResponse(res, "Your account is inactive. Please contact support.", 403);
        }

        // Attach user to request object
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;

        next();
    } catch (err) {
        console.error("Authentication Error:", err);
        return errorResponse(res, "Invalid or expired token. Please login again.", 401);
    }
};

/**
 * Check if user has required role
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, "Authentication required", 401);
        }

        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res,
                `Access denied. This action requires ${roles.join(' or ')} role.`,
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
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true
                }
            });
            
            if (user && user.status === 'active') {
                req.user = user;
                req.userId = user.id;
                req.userRole = user.role;
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
