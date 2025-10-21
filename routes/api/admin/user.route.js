// ===============================
// User Routes
// ===============================

const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    softDeleteUser
} = require('../../../controllers/api/user.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (authentication required)
router.post('/logout', authenticate, logoutUser);

// Admin/Manager routes
router.get('/users', authenticate, authorize('admin', 'manager'), getAllUsers);
router.get('/user/:id', authenticate, authorize('admin', 'manager'), getUserById);
router.put('/user/:id', authenticate, authorize('admin', 'manager'), updateUser);
router.delete('/user/:id', authenticate, authorize('admin'), deleteUser);
// router.patch('/user/:id/deactivate', authenticate, authorize('admin'), softDeleteUser);

module.exports = router;