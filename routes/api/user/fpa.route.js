const express = require('express');
const router = express.Router();
const { 
  generateFPASummary, 
  getMonthlyComparison,
  getCategoryBreakdown,
} = require('../../../controllers/api/fpa.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

// All routes require authentication - User can only see their own financial data
router.use(authenticate);

/**
 * =====================================================
 * USER FP&A ROUTES - User's Own Financial Planning & Analysis
 * =====================================================
 * 
 * Base path: /api/user/fpa
 * 
 * Users can only see their own financial analysis
 */

/**
 * Generate Monthly Financial Summary for User
 * GET /api/user/fpa/summary
 * 
 * Query Parameters:
 * - month (optional): Month number (1-12)
 * - year (optional): Year (default: current year)
 * 
 * Returns: User's own monthly financial summary
 */
router.get('/fpa/summary', generateFPASummary);

/**
 * Get Monthly Comparison Data for User
 * GET /api/user/fpa/monthly-comparison
 * 
 * Query Parameters:
 * - year (optional): Year (default: current year)
 * 
 * Returns: User's own monthly income vs expenses comparison
 */
router.get('/fpa/monthly-comparison', getMonthlyComparison);

/**
 * Get Income & Expense Categories Breakdown for User
 * GET /api/user/fpa/categories
 * 
 * Query Parameters:
 * - year (optional): Year (default: current year)
 * - month (optional): Month number (1-12)
 * 
 * Returns: User's own category breakdown
 */
router.get('/fpa/categories', getCategoryBreakdown);

module.exports = router;
