/**
 * FP&A Backend API Implementation Example
 * Node.js/Express with MongoDB/Mongoose
 * 
 * This file shows how to implement the FP&A endpoints in your Node.js backend
 */

const express = require('express');
const router = express.Router();
const Account = require('../models/Account'); // Your Account model
const { catchAsync } = require('../utils/errorHandler');

/**
 * GET /api/fpa/monthly
 * Get monthly financial data with category breakdown
 */
router.get('/monthly', catchAsync(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year + 1}-01-01`);

  // Aggregate monthly data
  const monthlyData = await Account.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' }
        },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
              '$amount',
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'Expense'] },
              '$amount',
              0
            ]
          }
        },
        rent: {
          $sum: {
            $cond: [{ $eq: ['$type', 'Rent'] }, '$amount', 0]
          }
        },
        deposits: {
          $sum: {
            $cond: [{ $eq: ['$type', 'Deposit'] }, '$amount', 0]
          }
        },
        maintenance: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'Expense'] },
                  { $eq: ['$category', 'Maintenance'] }
                ]
              },
              '$amount',
              0
            ]
          }
        },
        supplies: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'Expense'] },
                  { $eq: ['$category', 'Supplies'] }
                ]
              },
              '$amount',
              0
            ]
          }
        },
        utilities: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'Expense'] },
                  { $eq: ['$category', 'Utilities'] }
                ]
              },
              '$amount',
              0
            ]
          }
        },
        hvac: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'Expense'] },
                  { $eq: ['$category', 'HVAC'] }
                ]
              },
              '$amount',
              0
            ]
          }
        },
        security: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$type', 'Expense'] },
                  { $eq: ['$category', 'Security'] }
                ]
              },
              '$amount',
              0
            ]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Format month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formattedData = monthlyData.map(item => ({
    month: monthNames[item._id.month - 1],
    year: item._id.year,
    income: item.income || 0,
    expenses: item.expenses || 0,
    rent: item.rent || 0,
    deposits: item.deposits || 0,
    maintenance: item.maintenance || 0,
    supplies: item.supplies || 0,
    utilities: item.utilities || 0,
    hvac: item.hvac || 0,
    security: item.security || 0
  }));

  res.json({
    success: true,
    data: formattedData,
    message: 'Monthly financial data retrieved successfully'
  });
}));

/**
 * GET /api/fpa/yearly
 * Get yearly financial data
 */
router.get('/yearly', catchAsync(async (req, res) => {
  const yearlyData = await Account.aggregate([
    {
      $group: {
        _id: { $year: '$date' },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
              '$amount',
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'Expense'] },
              '$amount',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        year: '$_id',
        income: 1,
        expenses: 1,
        netIncome: { $subtract: ['$income', '$expenses'] }
      }
    },
    {
      $sort: { year: 1 }
    }
  ]);

  res.json({
    success: true,
    data: yearlyData,
    message: 'Yearly financial data retrieved successfully'
  });
}));

/**
 * GET /api/fpa/categories
 * Get category breakdown for income and expenses
 */
router.get('/categories', catchAsync(async (req, res) => {
  const { period = 'yearly', year = new Date().getFullYear() } = req.query;
  
  let startDate, endDate;
  
  if (period === 'monthly') {
    startDate = new Date(`${year}-01-01`);
    endDate = new Date(`${year + 1}-01-01`);
  } else {
    startDate = new Date(`${year}-01-01`);
    endDate = new Date(`${year + 1}-01-01`);
  }

  // Income categories
  const incomeCategories = await Account.aggregate([
    {
      $match: {
        type: { $in: ['Rent', 'Deposit', 'LateFees', 'Refund'] },
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Expense categories
  const expenseCategories = await Account.aggregate([
    {
      $match: {
        type: 'Expense',
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Format response
  const income = {};
  incomeCategories.forEach(item => {
    income[item._id] = item.total;
  });

  const expenses = {};
  expenseCategories.forEach(item => {
    expenses[item._id || 'Other'] = item.total;
  });

  res.json({
    success: true,
    data: {
      income,
      expenses,
      period,
      year: parseInt(year)
    },
    message: 'Category breakdown retrieved successfully'
  });
}));

/**
 * GET /api/fpa/kpis
 * Get key performance indicators
 */
router.get('/kpis', catchAsync(async (req, res) => {
  const { period = 'yearly', year = new Date().getFullYear() } = req.query;
  
  let data;
  if (period === 'monthly') {
    // Get monthly data for the year
    const monthlyData = await Account.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          income: {
            $sum: {
              $cond: [
                { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
                '$amount',
                0
              ]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0]
            }
          }
        }
      }
    ]);
    
    data = monthlyData;
  } else {
    // Get yearly data
    const yearlyData = await Account.aggregate([
      {
        $group: {
          _id: { $year: '$date' },
          income: {
            $sum: {
              $cond: [
                { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
                '$amount',
                0
              ]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    data = yearlyData.map(item => ({
      year: item._id,
      income: item.income,
      expenses: item.expenses
    }));
  }

  const current = period === 'monthly' 
    ? data[data.length - 1]
    : data.find(d => d.year === parseInt(year));
  
  const previous = period === 'monthly'
    ? data[data.length - 2]
    : data.find(d => d.year === parseInt(year) - 1);

  const totalIncome = data.reduce((sum, item) => sum + (item.income || 0), 0);
  const totalExpenses = data.reduce((sum, item) => sum + (item.expenses || 0), 0);
  const netIncome = (current?.income || 0) - (current?.expenses || 0);
  
  const avgMonthlyIncome = period === 'monthly'
    ? totalIncome / data.length
    : totalIncome / 12;
  const avgMonthlyExpenses = period === 'monthly'
    ? totalExpenses / data.length
    : totalExpenses / 12;

  const yoyGrowth = previous && previous.income > 0
    ? ((current.income - previous.income) / previous.income) * 100
    : 0;

  const profitMargin = current && current.income > 0
    ? (netIncome / current.income) * 100
    : 0;
  const expenseRatio = current && current.income > 0
    ? (current.expenses / current.income) * 100
    : 0;
  const currentRatio = current && current.expenses > 0
    ? current.income / current.expenses
    : 0;

  res.json({
    success: true,
    data: {
      netIncome,
      totalIncome,
      totalExpenses,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      yoyGrowth,
      profitMargin,
      expenseRatio,
      currentRatio
    },
    message: 'KPIs retrieved successfully'
  });
}));

/**
 * GET /api/fpa/breakeven
 * Calculate break even analysis
 */
router.get('/breakeven', catchAsync(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year + 1}-01-01`);

  // Get monthly data
  const monthlyData = await Account.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
              '$amount',
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  const avgMonthlyIncome = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length
    : 0;
  const avgMonthlyExpenses = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length
    : 0;

  // Assume 60% fixed costs, 40% variable costs
  const fixedCosts = avgMonthlyExpenses * 0.6;
  const variableCosts = avgMonthlyExpenses * 0.4;
  const contributionMargin = avgMonthlyIncome - variableCosts;
  const breakEvenUnits = contributionMargin > 0 
    ? fixedCosts / contributionMargin 
    : 0;
  const breakEvenRevenue = breakEvenUnits * avgMonthlyIncome;
  const marginOfSafety = avgMonthlyIncome - breakEvenRevenue;
  const marginOfSafetyPercent = avgMonthlyIncome > 0
    ? ((avgMonthlyIncome - breakEvenRevenue) / avgMonthlyIncome) * 100
    : 0;

  res.json({
    success: true,
    data: {
      fixedCosts,
      variableCosts,
      contributionMargin,
      breakEvenRevenue,
      breakEvenUnits,
      marginOfSafety,
      marginOfSafetyPercent,
      avgMonthlyIncome,
      avgMonthlyExpenses
    },
    message: 'Break even analysis retrieved successfully'
  });
}));

/**
 * GET /api/fpa/cashflow
 * Calculate cash flow analysis
 */
router.get('/cashflow', catchAsync(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year + 1}-01-01`);

  const monthlyData = await Account.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
              '$amount',
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let cumulative = 0;
  const cashFlow = monthlyData.map((item) => {
    const netCashFlow = item.income - item.expenses;
    cumulative += netCashFlow;
    
    return {
      month: monthNames[item._id - 1],
      income: item.income,
      expenses: item.expenses,
      netCashFlow,
      cumulative
    };
  });

  res.json({
    success: true,
    data: cashFlow,
    message: 'Cash flow analysis retrieved successfully'
  });
}));

/**
 * GET /api/fpa/ratios
 * Calculate financial ratios
 */
router.get('/ratios', catchAsync(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const yearlyData = await Account.aggregate([
    {
      $group: {
        _id: { $year: '$date' },
        income: {
          $sum: {
            $cond: [
              { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
              '$amount',
              0
            ]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $project: {
        year: '$_id',
        income: 1,
        expenses: 1
      }
    },
    {
      $sort: { year: 1 }
    }
  ]);

  const currentYear = yearlyData.find(d => d.year === parseInt(year));
  
  if (!currentYear) {
    return res.status(404).json({
      success: false,
      error: 'Year not found'
    });
  }

  const netIncome = currentYear.income - currentYear.expenses;
  
  const profitMargin = currentYear.income > 0
    ? (netIncome / currentYear.income) * 100
    : 0;
  const expenseRatio = currentYear.income > 0
    ? (currentYear.expenses / currentYear.income) * 100
    : 0;
  const currentRatio = currentYear.expenses > 0
    ? currentYear.income / currentYear.expenses
    : 0;
  const debtToIncome = currentYear.income > 0
    ? (currentYear.expenses / currentYear.income) * 100
    : 0;
  const returnOnRevenue = currentYear.income > 0
    ? (netIncome / currentYear.income) * 100
    : 0;

  res.json({
    success: true,
    data: {
      profitMargin,
      expenseRatio,
      currentRatio,
      debtToIncome,
      returnOnRevenue
    },
    message: 'Financial ratios retrieved successfully'
  });
}));

module.exports = router;




