// ===============================
// Payment Routes (Admin)
// ===============================

const express = require('express');
const router = express.Router();
const {
    recordPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    getPaymentSummary,
    getPendingPayments
} = require('../../../controllers/api/payment.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// All routes require authentication - Admin routes (owner should use owner-specific routes)
// Admin sees everything, employees need permissions

// Record new payment
router.post('/payment', authenticate, authorize('admin', 'manager', 'staff'), recordPayment);

// Get payment summary
router.get('/payments/summary', authenticate, authorize('admin', 'manager', 'staff'), getPaymentSummary);

// Get pending payments
router.get('/payments/pending', authenticate, authorize('admin', 'manager', 'staff'), getPendingPayments);

// Get all payments with filters and pagination
router.get('/payments', authenticate, authorize('admin', 'manager', 'staff'), getAllPayments);

// Get payment by ID
router.get('/payment/:id', authenticate, authorize('admin', 'manager', 'staff'), getPaymentById);

// Update payment
router.put('/payment/:id', authenticate, authorize('admin', 'manager', 'staff'), updatePayment);

// Delete payment - Admin only
router.delete('/payment/:id', authenticate, authorize('admin'), deletePayment);

module.exports = router;

