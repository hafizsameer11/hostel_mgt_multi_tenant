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
const { authenticate, authorize, authorizeAdminOrOwner } = require('../../../middleware/auth.middleware');

// ✅ Generate Monthly Financial Summary (calculations only)
// Query params: month, year, hostelId
router.get(
  '/fpa/summary',
  authenticate,
  authorizeAdminOrOwner(),
  generateFPASummary
);

// ✅ Get Monthly Comparison Data (Income vs Expenses)
// Query params: year, hostelId
router.get(
  '/fpa/monthly-comparison',
  authenticate,
  authorizeAdminOrOwner(),
  getMonthlyComparison
);

// ✅ Get Income & Expense Categories Breakdown
// Query params: year, month (optional), hostelId
router.get(
  '/fpa/categories',
  authenticate,
  authorizeAdminOrOwner(),
  getCategoryBreakdown
);

// ✅ Get Cash Flow Analysis
// Query params: year, hostelId
router.get(
  '/fpa/cash-flow',
  authenticate,
  authorizeAdminOrOwner(),
  getCashFlowAnalysis
);

// ✅ Get Financial Ratios
// Query params: year, month (optional), hostelId
router.get(
  '/fpa/ratios',
  authenticate,
  authorizeAdminOrOwner(),
  getFinancialRatios
);

// ✅ Generate and Download PDF Report
// Query params: month, year
router.get(
  '/fpa/print',
  authenticate,
  authorizeAdminOrOwner(),
  printFPAReport
);

module.exports = router;
