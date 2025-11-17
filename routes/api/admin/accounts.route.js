const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../middleware/auth.middleware');
const {
  getFinancialSummary,
  getPayables,
  getReceivables,
  getPayablesSummary,
} = require('../../../controllers/api/accounts.controller');

// All routes require authentication and admin/manager role
router.use(authenticate, authorize('admin', 'manager'));

/**
 * =====================================================
 * ACCOUNTS ROUTES - Financial Dashboard
 * =====================================================
 * 
 * Base path: /api/admin/accounts
 */

/**
 * Financial Summary
 * GET /api/admin/accounts/summary
 * 
 * Query Parameters:
 * - hostelId (optional): Filter by hostel ID
 * - startDate (optional): Start date for date range filter (ISO format)
 * - endDate (optional): End date for date range filter (ISO format)
 * 
 * Returns: Total Income, Expenses, Profit/Loss, Capital Invested, Receivables Breakdown
 */
router.get('/accounts/summary', getFinancialSummary);

/**
 * Payables Summary
 * GET /api/admin/accounts/payables/summary
 * 
 * Query Parameters:
 * - hostelId (optional): Filter by hostel ID
 * - search (optional): Search term for filtering
 * 
 * Returns: Summary of payables by type (bills, vendor, laundry)
 */
router.get('/accounts/payables/summary', getPayablesSummary);

/**
 * Payables List
 * GET /api/admin/accounts/payables
 * 
 * Query Parameters:
 * - type (optional): Type of payables - 'bills' | 'vendor' | 'laundry' (default: 'bills')
 * - hostelId (optional): Filter by hostel ID
 * - search (optional): Search by reference, tenant, or description
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 20)
 * 
 * Returns: List of payables with pagination and summary
 */
router.get('/accounts/payables', getPayables);

/**
 * Receivables List
 * GET /api/admin/accounts/receivables
 * 
 * Query Parameters:
 * - hostelId (optional): Filter by hostel ID
 * - search (optional): Search by reference, tenant, or description
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 20)
 * - startDate (optional): Start date for date range filter (ISO format)
 * - endDate (optional): End date for date range filter (ISO format)
 * - status (optional): Filter by status - 'pending' | 'overdue' | 'partial' | 'paid'
 * - view (optional): View filter - 'all' | 'pending' | 'overdue' | 'partial' | 'received' | 'paid' | 'everything' (default: 'all')
 * - category (optional): Filter by payment type/category
 * - type (optional): Alias for category parameter
 * 
 * Returns: List of receivables with pagination and summary breakdown
 */
router.get('/accounts/receivables', getReceivables);

module.exports = router;

