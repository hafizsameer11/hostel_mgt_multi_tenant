const express = require('express');
const router = express.Router();
const { 
  generateFPASummary,
  getDashboardData,
  printFPAReport,
  getMonthlyComparison,
  getCategoryBreakdown,
  getCashFlowAnalysis,
  getFinancialRatios,
  getYearOverYearGrowth,
  getBreakEvenAnalysis,
} = require('../../../controllers/api/fpa.controller');
const { authenticate, authorize } = require('../../../middleware/auth.middleware');

// ✅ Get Complete Dashboard Data (Main endpoint for frontend)
// Query params: year, hostelId, viewType (monthly|yearly)
router.get(
  '/fpa/dashboard',
  authenticate,
  authorize('admin', 'manager'),
  getDashboardData
);

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

// ✅ Get Year-over-Year Growth
// Query params: startYear (optional), endYear (optional), hostelId
router.get(
  '/fpa/year-over-year',
  authenticate,
  authorize('admin', 'manager'),
  getYearOverYearGrowth
);

// ✅ Get Break Even Analysis
// Query params: year, month (optional), hostelId
router.get(
  '/fpa/break-even',
  authenticate,
  authorize('admin', 'manager'),
  getBreakEvenAnalysis
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
