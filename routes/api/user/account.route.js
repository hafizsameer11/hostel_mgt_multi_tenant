const express = require('express');
const router = express.Router();
const {
  getFinancialSummary,
  getPayables,
  getReceivables,
} = require('../../../controllers/api/accounts.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

// All routes require authentication - User can only see their own account data
router.use(authenticate);

/**
 * =====================================================
 * USER ACCOUNT ROUTES - User's Own Financial Data
 * =====================================================
 * 
 * Base path: /api/user/accounts
 * 
 * Users can only see their own financial transactions and balances
 */

/**
 * Financial Summary for User
 * GET /api/user/accounts/summary
 * 
 * Returns: User's own financial summary (payments, balances, etc.)
 */
router.get('/accounts/summary', getFinancialSummary);

/**
 * User's Payables
 * GET /api/user/accounts/payables
 * 
 * Query Parameters:
 * - type? - Filter by type (bills|vendor|laundry|all)
 * - status? - Filter by status (pending|paid|partial)
 * - page? - Page number (default: 1)
 * - limit? - Items per page (default: 20)
 * 
 * Returns: User's own payables (bills, dues, etc.)
 */
router.get('/accounts/payables', getPayables);

/**
 * User's Receivables
 * GET /api/user/accounts/receivables
 * 
 * Query Parameters:
 * - status? - Filter by status (pending|received|partial)
 * - page? - Page number (default: 1)
 * - limit? - Items per page (default: 20)
 * 
 * Returns: User's own receivables (refunds, deposits, etc.)
 */
router.get('/accounts/receivables', getReceivables);

module.exports = router;
