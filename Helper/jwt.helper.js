// ===============================
// JWT Helper Functions
// ===============================

const jwt = require('jsonwebtoken');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'; // Default 7 days

/**
 * Generate JWT Token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
    try {
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRE
        });
        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Failed to generate token');
    }
};

/**
 * Verify JWT Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error);
        throw new Error('Invalid or expired token');
    }
};

/**
 * Set JWT token in HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {String} token - JWT token
 */
const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,        // Cannot be accessed by JavaScript (XSS protection)
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',    // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };

    res.cookie('token', token, cookieOptions);
};

/**
 * Clear JWT token cookie
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0) // Expire immediately
    });
};

module.exports = {
    generateToken,
    verifyToken,
    setTokenCookie,
    clearTokenCookie,
    JWT_SECRET
};

