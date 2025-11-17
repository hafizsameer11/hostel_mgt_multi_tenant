const { prisma } = require('../../config/db');
const { successResponse, errorResponse } = require('../../Helper/helper');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to build date range for a month
const buildDateRange = (year, month) => {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

// ===============================
// 🧮 Generate Full FP&A Summary
// ===============================
const generateFPASummary = async (req, res) => {
  try {
    const { month, year, hostelId } = req.query;
    
    // Validate and parse inputs
    const monthNum = month ? parseInt(month) : new Date().getMonth() + 1;
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const parsedHostelId = hostelId ? parseInt(hostelId) : null;

    if (monthNum < 1 || monthNum > 12) {
      return errorResponse(res, 'Invalid month. Must be between 1-12', 400);
    }

    if (yearNum < 2000 || yearNum > 9999) {
      return errorResponse(res, 'Invalid year', 400);
    }

    const { start, end } = buildDateRange(yearNum, monthNum);

    // Build filters
    const paymentFilter = {
      status: 'paid',
      paymentDate: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    const expenseFilter = {
      date: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    // ===== 1️⃣ Income & Expense Totals =====
    const [payments, expenses] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: paymentFilter,
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: expenseFilter,
      }),
    ]);

    const totalIncome = Number((payments._sum.amount || 0).toFixed(2));
    const totalExpense = Number((expenses._sum.amount || 0).toFixed(2));

    // ===== 2️⃣ Core Metrics =====
    const netIncome = Number((totalIncome - totalExpense).toFixed(2));
    const profitMargin = totalIncome > 0 
      ? Number(((netIncome / totalIncome) * 100).toFixed(2)) 
      : 0;
    const expenseRatio = totalIncome > 0 
      ? Number(((totalExpense / totalIncome) * 100).toFixed(2)) 
      : 0;

    // ===== 3️⃣ Break-Even Analysis =====
    const fixedCosts = Number((totalExpense * 0.6).toFixed(2));
    const variableCosts = Number((totalExpense * 0.4).toFixed(2));
    const contributionMargin = Number((totalIncome - variableCosts).toFixed(2));
    const contributionMarginRatio = totalIncome > 0
      ? Number(((contributionMargin / totalIncome) * 100).toFixed(2))
      : 0;
    const breakEvenRevenue = contributionMarginRatio > 0
      ? Number((fixedCosts / (contributionMarginRatio / 100)).toFixed(2))
      : 0;
    const marginOfSafety = totalIncome > 0
      ? Number((((totalIncome - breakEvenRevenue) / totalIncome) * 100).toFixed(2))
      : 0;

    // ===== 4️⃣ YoY & Growth Metrics =====
    const previousYear = yearNum - 1;
    const prevFPA = await prisma.fPA.findFirst({
      where: { 
        month: monthNum.toString(),
        year: previousYear,
        ...(parsedHostelId ? { hostelId: parsedHostelId } : { hostelId: null }),
      },
    });

    const prevProfit = prevFPA?.profit || 0;
    const yoyGrowth = prevProfit > 0 
      ? Number((((netIncome - prevProfit) / prevProfit) * 100).toFixed(2)) 
      : 0;
    const netProfitGrowth = prevProfit === 0 && netIncome > 0 
      ? 100 
      : yoyGrowth;

    // ===== 5️⃣ Operational Metrics =====
    const tenantFilter = parsedHostelId 
      ? {
          status: 'active',
          allocations: {
            some: { hostelId: parsedHostelId, status: 'active' }
          }
        }
      : { status: 'active' };

    const [totalTenants, totalRooms, totalBeds] = await Promise.all([
      prisma.tenant.count({ where: tenantFilter }),
      prisma.room.count({
        ...(parsedHostelId ? { where: { hostelId: parsedHostelId } } : {}),
      }),
      parsedHostelId
        ? prisma.bed.count({
            where: {
              room: {
                hostelId: parsedHostelId,
              },
            },
          })
        : prisma.bed.count(),
    ]);

    // Revenue per Available Unit (RevPAU)
    // Annual: (monthly income * 12) / totalBeds
    // Monthly: monthly income / totalBeds
    const annualRevPAU = totalBeds > 0 
      ? Number(((totalIncome * 12) / totalBeds).toFixed(2)) 
      : 0;
    const monthlyRevPAU = totalBeds > 0 
      ? Number((totalIncome / totalBeds).toFixed(2)) 
      : 0;

    // Collection Efficiency (Rent Collection Rate)
    const rentPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        ...paymentFilter,
        paymentType: 'rent',
      },
    });

    const allRentPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paymentType: 'rent',
        paymentDate: { gte: start, lt: end },
        ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
      },
    });

    const collectedRent = rentPayments._sum.amount || 0;
    const totalRentDue = allRentPayments._sum.amount || 0;
    const collectionEfficiency = totalRentDue > 0
      ? Number(((collectedRent / totalRentDue) * 100).toFixed(2))
      : 0;

    // ===== 6️⃣ Cash Flow =====
    const monthlyCashFlow = netIncome;
    
    // Get previous month's cumulative cash flow
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
    const { start: prevStart, end: prevEnd } = buildDateRange(prevYear, prevMonth);
    
    const prevMonthPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        paymentDate: { gte: prevStart, lt: prevEnd },
        ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
      },
    });

    const prevMonthExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: prevStart, lt: prevEnd },
        ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
      },
    });

    const prevMonthNet = (prevMonthPayments._sum.amount || 0) - (prevMonthExpenses._sum.amount || 0);
    const prevFPAForCumulative = await prisma.fPA.findFirst({
      where: {
        month: prevMonth.toString(),
        year: prevYear,
        ...(parsedHostelId ? { hostelId: parsedHostelId } : { hostelId: null }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const previousCumulative = prevFPAForCumulative?.profit 
      ? Number((prevFPAForCumulative.profit + prevMonthNet).toFixed(2))
      : prevMonthNet;
    
    const cumulativeCashFlow = Number((previousCumulative + monthlyCashFlow).toFixed(2));
    const cashflowRatio = totalExpense > 0 
      ? Number((totalIncome / totalExpense).toFixed(2)) 
      : 0;

    // ===== 7️⃣ Save or Update in DB =====
    const fpaData = {
      month: monthNum.toString(),
      year: yearNum,
      totalIncome,
      totalExpense,
      profit: netIncome,
      breakeven: breakEvenRevenue,
      cashflowRatio,
      profitMargin,
      expenseRatio,
      fixedCosts,
      variableCosts,
      contributionMargin,
      contributionMarginRatio,
      marginOfSafety,
      netProfitGrowth,
      yoyGrowth,
      collectionEfficiency,
      revPAU: annualRevPAU,
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    // Find existing FPA record
    const existingFPA = await prisma.fPA.findFirst({
      where: {
        month: monthNum.toString(),
        year: yearNum,
        ...(parsedHostelId ? { hostelId: parsedHostelId } : { hostelId: null }),
      },
    });

    const fpa = existingFPA
      ? await prisma.fPA.update({
          where: { id: existingFPA.id },
          data: fpaData,
        })
      : await prisma.fPA.create({
          data: fpaData,
        });

    // ===== 8️⃣ Return Comprehensive Response =====
    return successResponse(res, {
      summary: {
        month: monthNum,
        monthName: getMonthName(monthNum),
        year: yearNum,
        ...fpa,
      },
      metrics: {
        totalIncome,
        totalExpense,
        netIncome,
        profitMargin,
        expenseRatio,
        fixedCosts,
        variableCosts,
        contributionMargin,
        contributionMarginRatio,
        breakEvenRevenue,
        marginOfSafety,
        yoyGrowth,
        netProfitGrowth,
        collectionEfficiency,
        annualRevPAU,
        monthlyRevPAU,
        monthlyCashFlow,
        cumulativeCashFlow,
        cashflowRatio,
      },
      operational: {
        totalTenants,
        totalRooms,
        totalBeds,
      },
    }, 'FP&A Summary Generated Successfully');
  } catch (error) {
    console.error('FP&A Summary Error:', error);
    return errorResponse(res, error.message || 'Failed to generate FP&A summary', 500);
  }
};

// ===============================
// 🖨️ Generate FP&A Printable PDF
// ===============================
const printFPAReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const fpa = await prisma.fPA.findFirst({
      where: { month, year: parseInt(year) },
    });

    if (!fpa) return errorResponse(res, 'No FP&A record found', 404);

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `FPA_Report_${month}_${year}.pdf`;
    const filePath = path.join(__dirname, `../../../uploads/${fileName}`);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(18).text('🏨 Hostel Management - FP&A Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Month: ${month} / Year: ${year}`);
    doc.moveDown(2);

    const keyMetrics = [
      ['Total Income', fpa.totalIncome],
      ['Total Expense', fpa.totalExpense],
      ['Profit', fpa.profit],
      ['Profit Margin (%)', fpa.profitMargin],
      ['Expense Ratio (%)', fpa.expenseRatio],
      ['Break-Even Revenue', fpa.breakeven],
      ['Contribution Margin', fpa.contributionMargin],
      ['Contribution Margin Ratio (%)', fpa.contributionMarginRatio],
      ['Margin of Safety (%)', fpa.marginOfSafety],
      ['YoY Growth (%)', fpa.yoyGrowth],
      ['Net Profit Growth (%)', fpa.netProfitGrowth],
      ['Collection Efficiency (%)', fpa.collectionEfficiency],
      ['Revenue per Available Unit', fpa.revPAU],
    ];

    keyMetrics.forEach(([label, value]) => {
      doc.text(`${label}: Rs. ${Number(value || 0).toFixed(2)}`);
    });

    doc.moveDown(2);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.end();

    doc.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) console.error('Error sending file:', err);
      });
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message);
  }
};

// ===============================
// 📊 Get Monthly Comparison Data
// ===============================
const getMonthlyComparison = async (req, res) => {
  try {
    const { year, hostelId } = req.query;
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const parsedHostelId = hostelId ? parseInt(hostelId) : null;

    const start = new Date(yearNum, 0, 1, 0, 0, 0, 0);
    const end = new Date(yearNum + 1, 0, 1, 0, 0, 0, 0);

    const paymentFilter = {
      status: 'paid',
      paymentDate: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    const expenseFilter = {
      date: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    // Get all payments and expenses for the year
    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: paymentFilter,
        select: { amount: true, paymentDate: true },
      }),
      prisma.expense.findMany({
        where: expenseFilter,
        select: { amount: true, date: true },
      }),
    ]);

    // Group by month
    const monthlyData = Array.from({ length: 12 }, (_, idx) => ({
      month: idx + 1,
      monthName: getMonthName(idx + 1),
      income: 0,
      expense: 0,
      netIncome: 0,
    }));

    payments.forEach((payment) => {
      const month = new Date(payment.paymentDate).getMonth();
      monthlyData[month].income += payment.amount || 0;
    });

    expenses.forEach((expense) => {
      const month = new Date(expense.date).getMonth();
      monthlyData[month].expense += expense.amount || 0;
    });

    // Calculate net income for each month
    monthlyData.forEach((data) => {
      data.netIncome = Number((data.income - data.expense).toFixed(2));
      data.income = Number(data.income.toFixed(2));
      data.expense = Number(data.expense.toFixed(2));
    });

    return successResponse(res, {
      year: yearNum,
      monthlyData,
    }, 'Monthly comparison data fetched successfully');
  } catch (error) {
    console.error('Monthly Comparison Error:', error);
    return errorResponse(res, error.message || 'Failed to fetch monthly comparison', 500);
  }
};

// ===============================
// 📊 Get Income & Expense Categories
// ===============================
const getCategoryBreakdown = async (req, res) => {
  try {
    const { year, month, hostelId } = req.query;
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const monthNum = month ? parseInt(month) : null;
    const parsedHostelId = hostelId ? parseInt(hostelId) : null;

    let start, end;
    if (monthNum) {
      const range = buildDateRange(yearNum, monthNum);
      start = range.start;
      end = range.end;
    } else {
      start = new Date(yearNum, 0, 1, 0, 0, 0, 0);
      end = new Date(yearNum + 1, 0, 1, 0, 0, 0, 0);
    }

    const paymentFilter = {
      status: 'paid',
      paymentDate: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    const expenseFilter = {
      date: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: paymentFilter,
        select: { amount: true, paymentType: true },
      }),
      prisma.expense.findMany({
        where: expenseFilter,
        select: { amount: true, category: true },
      }),
    ]);

    // Group income by payment type
    const incomeByCategory = {};
    payments.forEach((payment) => {
      const category = payment.paymentType || 'other';
      incomeByCategory[category] = (incomeByCategory[category] || 0) + (payment.amount || 0);
    });

    // Group expenses by category
    const expenseByCategory = {};
    expenses.forEach((expense) => {
      const category = expense.category || 'other';
      expenseByCategory[category] = (expenseByCategory[category] || 0) + (expense.amount || 0);
    });

    // Calculate totals and percentages
    const totalIncome = Object.values(incomeByCategory).reduce((sum, val) => sum + val, 0);
    const totalExpense = Object.values(expenseByCategory).reduce((sum, val) => sum + val, 0);

    const incomeCategories = Object.entries(incomeByCategory).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: totalIncome > 0 ? Number(((amount / totalIncome) * 100).toFixed(2)) : 0,
    }));

    const expenseCategories = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(2)) : 0,
    }));

    return successResponse(res, {
      income: {
        total: Number(totalIncome.toFixed(2)),
        categories: incomeCategories,
      },
      expenses: {
        total: Number(totalExpense.toFixed(2)),
        categories: expenseCategories,
      },
    }, 'Category breakdown fetched successfully');
  } catch (error) {
    console.error('Category Breakdown Error:', error);
    return errorResponse(res, error.message || 'Failed to fetch category breakdown', 500);
  }
};

// ===============================
// 💰 Get Cash Flow Analysis
// ===============================
const getCashFlowAnalysis = async (req, res) => {
  try {
    const { year, hostelId } = req.query;
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const parsedHostelId = hostelId ? parseInt(hostelId) : null;

    const monthlyCashFlow = [];

    for (let month = 1; month <= 12; month++) {
      const { start, end } = buildDateRange(yearNum, month);

      const [payments, expenses] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'paid',
            paymentDate: { gte: start, lt: end },
            ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
          },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            date: { gte: start, lt: end },
            ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
          },
        }),
      ]);

      const income = payments._sum.amount || 0;
      const expense = expenses._sum.amount || 0;
      const net = income - expense;

      monthlyCashFlow.push({
        month,
        monthName: getMonthName(month),
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        netIncome: Number(net.toFixed(2)),
      });
    }

    // Calculate cumulative cash flow
    let cumulative = 0;
    const cashFlowWithCumulative = monthlyCashFlow.map((data) => {
      cumulative += data.netIncome;
      return {
        ...data,
        cumulativeCashFlow: Number(cumulative.toFixed(2)),
      };
    });

    return successResponse(res, {
      year: yearNum,
      cashFlow: cashFlowWithCumulative,
    }, 'Cash flow analysis fetched successfully');
  } catch (error) {
    console.error('Cash Flow Analysis Error:', error);
    return errorResponse(res, error.message || 'Failed to fetch cash flow analysis', 500);
  }
};

// ===============================
// 📈 Get Financial Ratios
// ===============================
const getFinancialRatios = async (req, res) => {
  try {
    const { year, month, hostelId } = req.query;
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const monthNum = month ? parseInt(month) : null;
    const parsedHostelId = hostelId ? parseInt(hostelId) : null;

    let start, end;
    if (monthNum) {
      const range = buildDateRange(yearNum, monthNum);
      start = range.start;
      end = range.end;
    } else {
      start = new Date(yearNum, 0, 1, 0, 0, 0, 0);
      end = new Date(yearNum + 1, 0, 1, 0, 0, 0, 0);
    }

    const paymentFilter = {
      status: 'paid',
      paymentDate: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    const expenseFilter = {
      date: { gte: start, lt: end },
      ...(parsedHostelId ? { hostelId: parsedHostelId } : {}),
    };

    const [payments, expenses] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: paymentFilter,
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: expenseFilter,
      }),
    ]);

    const totalIncome = payments._sum.amount || 0;
    const totalExpense = expenses._sum.amount || 0;
    const netIncome = totalIncome - totalExpense;

    // Calculate ratios
    const profitMargin = totalIncome > 0 
      ? Number(((netIncome / totalIncome) * 100).toFixed(2)) 
      : 0;

    const expenseRatio = totalIncome > 0 
      ? Number(((totalExpense / totalIncome) * 100).toFixed(2)) 
      : 0;

    const currentRatio = totalExpense > 0 
      ? Number((totalIncome / totalExpense).toFixed(2)) 
      : 0;

    const operatingExpenseRatio = totalIncome > 0 
      ? Number(((totalExpense / totalIncome) * 100).toFixed(2)) 
      : 0;

    const returnOnRevenue = totalIncome > 0 
      ? Number(((netIncome / totalIncome) * 100).toFixed(2)) 
      : 0;

    return successResponse(res, {
      ratios: {
        profitMargin: {
          value: profitMargin,
          label: 'Profit Margin',
          description: 'Net Profit / Revenue',
        },
        expenseRatio: {
          value: expenseRatio,
          label: 'Expense Ratio',
          description: 'Expenses / Revenue',
        },
        currentRatio: {
          value: currentRatio,
          label: 'Current Ratio',
          description: 'Income / Expenses',
        },
        operatingExpenseRatio: {
          value: operatingExpenseRatio,
          label: 'Operating Expense Ratio',
          description: 'Operating Costs / Revenue',
        },
        returnOnRevenue: {
          value: returnOnRevenue,
          label: 'Return on Revenue',
          description: 'ROI from Revenue',
        },
      },
      summary: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        netIncome: Number(netIncome.toFixed(2)),
      },
    }, 'Financial ratios fetched successfully');
  } catch (error) {
    console.error('Financial Ratios Error:', error);
    return errorResponse(res, error.message || 'Failed to fetch financial ratios', 500);
  }
};

module.exports = { 
  generateFPASummary, 
  printFPAReport,
  getMonthlyComparison,
  getCategoryBreakdown,
  getCashFlowAnalysis,
  getFinancialRatios,
};
