// ===============================
// Dashboard Overview Routes
// ===============================

const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../../../controllers/api/dashboard/overview.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// =================== DASHBOARD OVERVIEW ROUTE ===================

/**
 * @route   GET /api/admin/dashboard/overview
 * @desc    Get comprehensive dashboard overview with statistics
 * @access  Admin, Manager
 * @query   hostelId (optional) - Filter by specific hostel
 * @returns Dashboard data including:
 *          - Summary Cards: Occupancy Rate, Monthly Revenue, Active Tenants, Active Vendors
 *          - Overview: Occupancy, Revenue, Tenants, Vendors, Alerts, Pending Payments
 *          - Profit & Loss: Last 3 months with revenue, expenses, and net income
 *          - Employee Activity Log: Latest 10 activities
 *          - Transactions: Payable and Receivable payments (5 most recent each)
 *          - Recent Bills: Expense payments and refund transactions (pending/overdue)
 *          - Recent Maintenance: Maintenance alerts/requests (5 most recent)
 *          - Unpaid Rent: Breakdown by aging buckets (0-30, 31-60, 61-90, 91+ days)
 *          - Check In & Check Out: Counts for last 30 days and next 30 days
 * @note    Data is cached for 10 minutes for performance
 */
router.get('/dashboard/overview', 
    authenticate, 
    authorize('admin', 'manager'),
    getDashboardOverview
);

module.exports = router;

