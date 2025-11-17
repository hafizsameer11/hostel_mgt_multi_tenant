const express = require('express');
const router = express.Router();
const { 
  generateFPASummary, 
  printFPAReport,
  getMonthlyComparison,
  getCategoryBreakdown,
  getCashFlowAnalysis,
  getFinancialRatios,
} = require('../../../controllers/api/fpa.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// ✅ Generate Monthly Financial Summary (calculations only)
// Query params: month, year, hostelId
router.get(
  '/fpa/summary',
  authenticate,
  authorize('admin', 'manager'),
  generateFPASummary
);

// ✅ Get Monthly Comparison Data (Income vs Expenses)
// Query params: year, hostelId
router.get(
  '/fpa/monthly-comparison',
  authenticate,
  authorize('admin', 'manager'),
  getMonthlyComparison
);

// ✅ Get Income & Expense Categories Breakdown
// Query params: year, month (optional), hostelId
router.get(
  '/fpa/categories',
  authenticate,
  authorize('admin', 'manager'),
  getCategoryBreakdown
);

// ✅ Get Cash Flow Analysis
// Query params: year, hostelId
router.get(
  '/fpa/cash-flow',
  authenticate,
  authorize('admin', 'manager'),
  getCashFlowAnalysis
);

// ✅ Get Financial Ratios
// Query params: year, month (optional), hostelId
router.get(
  '/fpa/ratios',
  authenticate,
  authorize('admin', 'manager'),
  getFinancialRatios
);

// ✅ Generate and Download PDF Report
// Query params: month, year
router.get(
  '/fpa/print',
  authenticate,
  authorize('admin', 'manager'),
  printFPAReport
);

module.exports = router;
