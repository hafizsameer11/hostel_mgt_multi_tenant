const { prisma } = require('../../../config/db');
const { successResponse, errorResponse } = require('../../../Helper/helper');

// =================== CACHE HELPERS ===================
// Lightweight in-memory cache (optional external cache can be wired in)
let memoryCache = {};
let setCache = async (k, v, ttl = 600) => (memoryCache[k] = { v, exp: Date.now() + ttl * 1000 });
let getCache = async (k) => {
  const hit = memoryCache[k];
  if (!hit) return null;
  if (hit.exp < Date.now()) { delete memoryCache[k]; return null; }
  return hit.v;
};
let delCache = async (k) => { delete memoryCache[k]; };

// Try to use external cache if available
try {
  const wired = require('../../utils/cache');
  setCache = wired.setCache || setCache;
  getCache = wired.getCache || getCache;
  delCache = wired.delCache || delCache;
} catch (_) {
  // Use in-memory cache if external cache not available
}

// =================== DATE HELPERS ===================
const startOfMonth = (y, m) => new Date(y, m - 1, 1, 0, 0, 0, 0);
const startOfNextMonth = (y, m) => (m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1));
const prevMonthPair = (y, m) => (m === 1 ? [y - 1, 12] : [y, m - 1]);

// =================== FORMATTING HELPERS ===================
const DASHBOARD_CURRENCY = process.env.DASHBOARD_CURRENCY || 'USD';

const safeCurrencyFormat = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.00';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: DASHBOARD_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  } catch (err) {
    return Number(value).toFixed(2);
  }
};

const formatPercent = (value, fractionDigits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.00%';
  const rounded = Number(value).toFixed(fractionDigits);
  return `${rounded}%`;
};

const relativeTimeFromNow = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'just now';
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffMs < day) {
    const hrs = Math.floor(diffMs / hour);
    return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffMs / day);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const toTitleCase = (value) => {
  if (!value) return null;
  return value
    .toString()
    .split(/[\s-_]+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

// =================== CACHE INVALIDATION ===================
// Call this from other controllers when payments/allocations/tenants/vendors change
const invalidateDashboardCache = async (hostelId) => {
  const key = `dash_overview_${hostelId || 'all'}`;
  await delCache(key);
};

// =================== GET DASHBOARD OVERVIEW ===================
/**
 * @route   GET /api/admin/dashboard/overview
 * @desc    Get comprehensive dashboard overview with statistics
 * @access  Admin, Manager
 * @query   hostelId (optional) - Filter by specific hostel
 * @returns Dashboard data with all statistics from database
 */
const getDashboardOverview = async (req, res) => {
  try {
    // Extract query parameters
    const { hostelId } = req.query;
    const hostelIdNum = hostelId ? Number(hostelId) : null;
    const cacheKey = `dash_overview_${hostelIdNum || 'all'}`;

    // Check cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return successResponse(res, cached, 'Dashboard data (cached)', 200);
    }

    // Calculate date ranges for current and previous month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const currFrom = startOfMonth(year, month);
    const currTo = startOfNextMonth(year, month);
    const [py, pm] = prevMonthPair(year, month);
    const prevFrom = startOfMonth(py, pm);
    const prevTo = startOfNextMonth(py, pm);

    // Build hostel filter if provided
    const hostelFilter = hostelIdNum ? { hostelId: hostelIdNum } : {};

    // 1) OCCUPANCY RATE - Calculate from database
    // Count beds through Room -> Hostel relationship (Bed doesn't have direct hostelId)
    const bedCountWhere = hostelIdNum 
      ? { room: { hostelId: hostelIdNum } }
      : {};
    const roomCountWhere = hostelIdNum 
      ? { hostelId: hostelIdNum }
      : {};
    
    const [totalBeds, totalRooms] = await Promise.all([
      prisma.bed.count({ where: bedCountWhere }),
      prisma.room.count({ where: roomCountWhere })
    ]);
    
    // Prefer Beds count, fallback to Rooms count
    const totalUnits = totalBeds > 0 ? totalBeds : totalRooms;

    const occupiedUnits = await prisma.allocation.count({
      where: { status: 'active', ...(hostelIdNum && hostelFilter) }
    });

    const occupancyRate = totalUnits ? (occupiedUnits / totalUnits) * 100 : 0;

    // Calculate last month occupancy (proxy: new active allocations created last month)
    const lastMonthAllocs = await prisma.allocation.count({
      where: { createdAt: { gte: prevFrom, lt: prevTo }, ...(hostelIdNum && hostelFilter) }
    });
    const lastMonthOcc = totalUnits ? (lastMonthAllocs / totalUnits) * 100 : 0;
    const occGrowth = lastMonthOcc > 0 ? ((occupancyRate - lastMonthOcc) / lastMonthOcc) * 100
                                       : (occupancyRate > 0 ? 100 : 0);

    // 2) MONTHLY REVENUE - Fetch from Payment table (current vs last month)
    const [currentRevenue, lastRevenue] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'paid', 
          paymentDate: { gte: currFrom, lt: currTo }, 
          ...(hostelIdNum && hostelFilter) 
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'paid', 
          paymentDate: { gte: prevFrom, lt: prevTo }, 
          ...(hostelIdNum && hostelFilter) 
        }
      })
    ]);
    const currRev = currentRevenue._sum.amount || 0;
    const prevRev = lastRevenue._sum.amount || 0;
    const revenueGrowth = prevRev > 0 ? ((currRev - prevRev) / prevRev) * 100 : (currRev > 0 ? 100 : 0);

    // 3) ACTIVE TENANTS / VENDORS / OPEN ALERTS / PENDING PAYMENTS
    const [
      activeTenants, lastTenants,
      activeVendors, lastVendors,
      openAlerts,    lastAlerts,
      pendingPayments, lastPendingPayments
    ] = await Promise.all([
      prisma.tenant.count({
        where: {
          status: 'active',
          ...(hostelIdNum && { allocations: { some: { status: 'active', hostelId: hostelIdNum } } })
        }
      }),
      prisma.tenant.count({
        where: {
          status: 'active',
          createdAt: { lt: currFrom },
          ...(hostelIdNum && { allocations: { some: { hostelId: hostelIdNum } } })
        }
      }),
      prisma.vendor.count({ where: { status: 'active', ...(hostelIdNum && { hostelId: hostelIdNum }) } }),
      prisma.vendor.count({
        where: {
          status: 'active',
          createdAt: { lt: currFrom },
          ...(hostelIdNum && { hostelId: hostelIdNum })
        }
      }),
      prisma.alert.count({ 
        where: { 
          status: { in: ['pending', 'in_progress'] },
          ...(hostelIdNum && hostelFilter) 
        } 
      }),
      prisma.alert.count({
        where: {
          status: { in: ['pending', 'in_progress'] },
          createdAt: { lt: currFrom },
          ...(hostelIdNum && hostelFilter)
        }
      }),
      prisma.payment.count({ 
        where: { 
          status: 'pending', 
          ...(hostelIdNum && hostelFilter) 
        } 
      }),
      prisma.payment.count({
        where: {
          status: 'pending',
          createdAt: { lt: currFrom },
          ...(hostelIdNum && hostelFilter)
        }
      })
    ]);

    const growth = (c, p) => (p > 0 ? ((c - p) / p) * 100 : (c > 0 ? 100 : 0));
    const tenantGrowth  = growth(activeTenants,  lastTenants);
    const vendorGrowth  = growth(activeVendors,  lastVendors);
    const alertGrowth   = growth(openAlerts,     lastAlerts);
    const pendingGrowth = growth(pendingPayments, lastPendingPayments);

    // 4) PROFIT & LOSS - Fetch from Transaction, Payment, and Expense tables (last 3 months)
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setDate(1);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    // Fetch revenue and expense data from multiple sources
    const [revenueTransactions, revenuePayments, expenseTransactions, expensePayments, expenseRecords] = await Promise.all([
      // Revenue: Rent + Deposit transactions (status = completed)
      prisma.transaction.findMany({
        where: {
          status: 'completed',
          transactionType: { in: ['rent', 'deposit', 'rent_received', 'deposit_received'] },
          createdAt: { gte: threeMonthsAgo },
          ...(hostelIdNum && hostelFilter)
        },
        select: {
          amount: true,
          createdAt: true
        }
      }),
      // Revenue: Rent + Deposit payments (status = paid) - fallback
      prisma.payment.findMany({
        where: {
          status: 'paid',
          paymentType: { in: ['rent', 'deposit'] },
          paymentDate: { gte: threeMonthsAgo },
          ...(hostelIdNum && hostelFilter)
        },
        select: {
          amount: true,
          paymentDate: true
        }
      }),
      // Expenses: Expense transactions (status = completed)
      prisma.transaction.findMany({
        where: {
          status: 'completed',
          transactionType: { 
            in: ['expense', 'maintenance', 'electricity', 'water', 'other', 'expense_paid'] 
          },
          createdAt: { gte: threeMonthsAgo },
          ...(hostelIdNum && hostelFilter)
        },
        select: {
          amount: true,
          createdAt: true
        }
      }),
      // Expenses: Maintenance, electricity, water, other payments (status = paid) - fallback
      prisma.payment.findMany({
        where: {
          status: 'paid',
          paymentType: { in: ['maintenance', 'electricity', 'water', 'other'] },
          paymentDate: { gte: threeMonthsAgo },
          ...(hostelIdNum && hostelFilter)
        },
        select: {
          amount: true,
          paymentDate: true
        }
      }),
      // Expenses from Expense model
      prisma.expense.findMany({
        where: {
          date: { gte: threeMonthsAgo },
          ...(hostelIdNum && hostelFilter)
        },
        select: {
          amount: true,
          date: true
        }
      })
    ]);

    // Group by month
    const monthMap = new Map();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Process revenue transactions
    revenueTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { revenue: 0, expenses: 0, year: date.getFullYear(), month: date.getMonth() + 1 });
      }
      const entry = monthMap.get(monthKey);
      entry.revenue += Number(transaction.amount || 0);
    });

    // Process revenue payments (fallback if transactions are empty)
    revenuePayments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { revenue: 0, expenses: 0, year: date.getFullYear(), month: date.getMonth() + 1 });
      }
      const entry = monthMap.get(monthKey);
      entry.revenue += Number(payment.amount || 0);
    });

    // Process expense transactions
    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { revenue: 0, expenses: 0, year: date.getFullYear(), month: date.getMonth() + 1 });
      }
      const entry = monthMap.get(monthKey);
      entry.expenses += Number(transaction.amount || 0);
    });

    // Process expense payments (fallback if transactions are empty)
    expensePayments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { revenue: 0, expenses: 0, year: date.getFullYear(), month: date.getMonth() + 1 });
      }
      const entry = monthMap.get(monthKey);
      entry.expenses += Number(payment.amount || 0);
    });

    // Process expense records
    expenseRecords.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { revenue: 0, expenses: 0, year: date.getFullYear(), month: date.getMonth() + 1 });
      }
      const entry = monthMap.get(monthKey);
      entry.expenses += Number(expense.amount || 0);
    });

    // Convert to array and format
    const profitLossSeries = Array.from(monthMap.entries())
      .sort((a, b) => {
        if (a[1].year !== b[1].year) return a[1].year - b[1].year;
        return a[1].month - b[1].month;
      })
      .slice(-3) // Last 3 months
      .map(([key, data]) => ({
        month: `${monthNames[data.month - 1]} ${data.year}`,
        revenue: Number(data.revenue.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2)),
        netIncome: Number((data.revenue - data.expenses).toFixed(2))
      }));

    const totalNetIncome = profitLossSeries.reduce((a, r) => a + r.netIncome, 0);

    // 5) EMPLOYEE/USER ACTIVITY LOG - Fetch latest 10 activities from database
    const activityLog = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            userRole: {
              select: {
                id: true,
                roleName: true,
                description: true
              }
            },
            employeeProfile: {
              select: {
                designation: true,
                department: true
              }
            },
            managedHostels: {
              select: {
                id: true,
                name: true
              },
              take: 1
            }
          }
        }
      }
    });

    // Format activity log entries according to schema
    const formattedActivityLog = activityLog.map((entry) => {
      const userName = entry.user?.username || entry.user?.email || 'System';
      const userRole = entry.user?.employeeProfile?.designation
        || (entry.user?.userRole ? toTitleCase(entry.user.userRole.roleName) : null)
        || 'Staff';
      const hostelName = entry.user?.managedHostels?.[0]?.name || null;

      return {
        id: entry.id,
        employeeName: userName,
        employeeRole: userRole,
        action: entry.action,
        description: entry.description || entry.module || null,
        hostelName: hostelName,
        timestamp: entry.createdAt
      };
    });

    // 6) PAYABLE & RECEIVABLE PAYMENTS - Fetch from Payment table
    // Payable: All paid transactions | Receivable: Paid Rent/Deposit only
    const [payablePaymentsRaw, receivablePaymentsRaw] = await Promise.all([
      // Payable: All paid transactions (5 most recent) - includes Rent, Deposit, Expense
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        where: { 
          status: 'paid',
          paymentType: { in: ['rent', 'deposit', 'maintenance', 'electricity', 'water', 'other'] },
          ...(hostelIdNum && hostelFilter) 
        },
        include: {
          tenant: { select: { id: true, name: true } },
          hostel: { select: { id: true, name: true } },
          allocation: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } }
            }
          },
          booking: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } }
            }
          }
        }
      }),
      // Receivable: Paid Rent/Deposit transactions (5 most recent)
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        where: { 
          status: 'paid',
          paymentType: { in: ['rent', 'deposit'] },
          ...(hostelIdNum && hostelFilter) 
        },
        include: {
          tenant: { select: { id: true, name: true } },
          hostel: { select: { id: true, name: true } },
          allocation: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } }
            }
          },
          booking: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } }
            }
          }
        }
      })
    ]);

    const mapPaymentRow = (payment) => {
      const roomNumber =
        payment?.allocation?.room?.roomNumber ||
        payment?.booking?.room?.roomNumber ||
        null;
      const baseDate = payment.paymentDate || payment.createdAt;
      return {
        id: payment.id,
        date: baseDate,
        dateFormatted: relativeTimeFromNow(baseDate),
        ref: payment.receiptNumber || `PAY-${String(payment.id).padStart(4, '0')}`,
        type: payment.paymentType || 'rent',
        amount: Number(payment.amount || 0),
        amountFormatted: safeCurrencyFormat(payment.amount || 0),
        status: payment.status,
        tenantName: payment.tenant?.name || 'N/A',
        hostelName: payment.hostel?.name || null,
        description: payment.remarks || null,
        property: roomNumber || null
      };
    };

    const payablePayments = payablePaymentsRaw.map(mapPaymentRow);
    const receivablePayments = receivablePaymentsRaw.map(mapPaymentRow);

    // 7) RECENT BILLS - Fetch Expense payments and Refund transactions with Pending/Overdue status
    const [expenseBillsRaw, refundBillsRaw] = await Promise.all([
      // Expense payments with Pending/Overdue status
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        where: {
          paymentType: { in: ['maintenance', 'electricity', 'water', 'other'] },
          status: { in: ['pending', 'overdue'] },
          ...(hostelIdNum && hostelFilter)
        },
        include: {
          tenant: { select: { id: true, name: true } },
          hostel: { select: { id: true, name: true } },
          allocation: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } }
            }
          },
          booking: {
            select: {
              id: true,
              room: { select: { id: true, roomNumber: true } }
            }
          }
        }
      }),
      // Refund transactions with Pending/Overdue status
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          transactionType: { contains: 'refund' },
          status: { in: ['pending', 'processing'] },
          ...(hostelIdNum && hostelFilter)
        },
        include: {
          tenant: { select: { id: true, name: true } },
          hostel: { select: { id: true, name: true } },
          payment: {
            include: {
              allocation: {
                select: {
                  id: true,
                  room: { select: { id: true, roomNumber: true } }
                }
              },
              booking: {
                select: {
                  id: true,
                  room: { select: { id: true, roomNumber: true } }
                }
              }
            }
          }
        }
      })
    ]);

    // Map expense bills
    const expenseBills = expenseBillsRaw.map(payment => {
      const roomNumber =
        payment?.allocation?.room?.roomNumber ||
        payment?.booking?.room?.roomNumber ||
        null;
      const baseDate = payment.paymentDate || payment.createdAt;
      return {
        id: payment.id,
        date: baseDate,
        dateFormatted: relativeTimeFromNow(baseDate),
        ref: payment.receiptNumber || `PAY-${String(payment.id).padStart(4, '0')}`,
        type: payment.paymentType || 'expense',
        amount: Number(payment.amount || 0),
        amountFormatted: safeCurrencyFormat(payment.amount || 0),
        status: payment.status,
        tenantName: payment.tenant?.name || 'N/A',
        hostelName: payment.hostel?.name || null,
        description: payment.remarks || null,
        property: roomNumber || null
      };
    });

    // Map refund bills
    const refundBills = refundBillsRaw.map(transaction => {
      const roomNumber =
        transaction?.payment?.allocation?.room?.roomNumber ||
        transaction?.payment?.booking?.room?.roomNumber ||
        null;
      const baseDate = transaction.createdAt;
      return {
        id: transaction.id,
        date: baseDate,
        dateFormatted: relativeTimeFromNow(baseDate),
        ref: transaction.orderId || transaction.merchantTxnId || `TXN-${String(transaction.id).padStart(4, '0')}`,
        type: 'refund',
        amount: Number(transaction.amount || 0),
        amountFormatted: safeCurrencyFormat(transaction.amount || 0),
        status: transaction.status === 'pending' ? 'pending' : transaction.status === 'processing' ? 'pending' : 'overdue',
        tenantName: transaction.tenant?.name || 'N/A',
        hostelName: transaction.hostel?.name || null,
        description: transaction.responseMessage || null,
        property: roomNumber || null
      };
    });

    // Combine and sort by date DESC, take top 5
    const recentBills = [...expenseBills, ...refundBills]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // 8) RECENT MAINTENANCE - Fetch maintenance alerts/requests from Alert table
    const recentMaintenanceRaw = await prisma.alert.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: {
        maintenanceType: { not: null },
        ...(hostelIdNum && hostelFilter)
      },
      include: {
        tenant: { select: { id: true, name: true } },
        hostel: { select: { id: true, name: true } },
        room: { select: { id: true, roomNumber: true } }
      }
    });

    const recentMaintenance = recentMaintenanceRaw.map(alert => ({
      id: alert.id,
      description: alert.description || alert.title,
      property: alert.room?.roomNumber || null,
      unit: alert.room?.roomNumber || null,
      status: alert.status,
      createdAt: alert.createdAt,
      createdAtFormatted: relativeTimeFromNow(alert.createdAt),
      tenantName: alert.tenant?.name || null,
      hostelName: alert.hostel?.name || null
    }));

    // 9) UNPAID RENT - Fetch rent payments with Pending/Overdue status and calculate aging
    const unpaidRentRaw = await prisma.payment.findMany({
      where: {
        paymentType: 'rent',
        status: { in: ['pending', 'overdue'] },
        ...(hostelIdNum && hostelFilter)
      },
      include: {
        tenant: { select: { id: true, name: true } },
        hostel: { select: { id: true, name: true } },
        allocation: {
          select: {
            id: true,
            room: { select: { id: true, roomNumber: true } }
          }
        }
      }
    });

    // Calculate aging buckets
    const agingBuckets = {
      '0-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '61-90': { amount: 0, count: 0 },
      '91+': { amount: 0, count: 0 }
    };

    const unpaidRentTenants = unpaidRentRaw.map(payment => {
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      const daysOld = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(payment.amount || 0);

      // Categorize into aging buckets
      if (daysOld <= 30) {
        agingBuckets['0-30'].amount += amount;
        agingBuckets['0-30'].count += 1;
      } else if (daysOld <= 60) {
        agingBuckets['31-60'].amount += amount;
        agingBuckets['31-60'].count += 1;
      } else if (daysOld <= 90) {
        agingBuckets['61-90'].amount += amount;
        agingBuckets['61-90'].count += 1;
      } else {
        agingBuckets['91+'].amount += amount;
        agingBuckets['91+'].count += 1;
      }

      const baseDate = payment.paymentDate || payment.createdAt;
      return {
        id: payment.id,
        tenantName: payment.tenant?.name || 'N/A',
        amount: amount,
        amountFormatted: safeCurrencyFormat(amount),
        daysOld: daysOld,
        status: payment.status,
        date: baseDate,
        dateFormatted: relativeTimeFromNow(baseDate),
        hostelName: payment.hostel?.name || null,
        property: payment.allocation?.room?.roomNumber || null
      };
    }).sort((a, b) => b.amount - a.amount); // Sort by amount DESC

    const totalUnpaidAmount = unpaidRentTenants.reduce((sum, t) => sum + t.amount, 0);
    
    // Get count of paid rent payments for summary
    const paidRentCount = await prisma.payment.count({
      where: {
        paymentType: 'rent',
        status: 'paid',
        ...(hostelIdNum && hostelFilter)
      }
    });

    const unpaidRent = {
      totalAmount: totalUnpaidAmount,
      totalFormatted: safeCurrencyFormat(totalUnpaidAmount),
      aging: Object.entries(agingBuckets).map(([range, data]) => ({
        range,
        amount: Number(data.amount.toFixed(2)),
        count: data.count
      })),
      tenants: unpaidRentTenants,
      summary: {
        paidCount: paidRentCount,
        unpaidCount: unpaidRentTenants.length
      }
    };

    // 10) CHECK-IN / CHECK-OUT - Fetch from Allocation table
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [checkIns, checkOuts] = await Promise.all([
      // Check-ins in last 30 days
      prisma.allocation.count({
        where: {
          checkInDate: { gte: thirtyDaysAgo, lte: now },
          ...(hostelIdNum && hostelFilter)
        }
      }),
      // Check-outs in next 30 days
      prisma.allocation.count({
        where: {
          expectedCheckOutDate: { gte: now, lte: thirtyDaysFromNow },
          status: 'active',
          ...(hostelIdNum && hostelFilter)
        }
      })
    ]);

    const checkInCheckOut = {
      checkIns: {
        count: checkIns,
        period: 'Last 30 days'
      },
      checkOuts: {
        count: checkOuts,
        period: 'Next 30 days'
      },
      total: checkIns + checkOuts
    };

    const sumAmount = (records) => records.reduce((acc, row) => acc + (row.amount || 0), 0);

    const summaryCards = [
      {
        key: 'occupancyRate',
        title: 'Occupancy Rate',
        value: Number(occupancyRate.toFixed(2)),
        valueFormatted: formatPercent(occupancyRate),
        changePercent: Number(occGrowth.toFixed(2)),
        changeFormatted: `${occGrowth >= 0 ? '+' : ''}${occGrowth.toFixed(2)}%`,
        direction: occGrowth > 0 ? 'up' : occGrowth < 0 ? 'down' : 'flat',
        caption: 'vs last month',
        meta: { totalUnits, occupiedUnits }
      },
      {
        key: 'monthlyRevenue',
        title: 'Monthly Revenue',
        value: currRev,
        valueFormatted: safeCurrencyFormat(currRev),
        changePercent: Number(revenueGrowth.toFixed(2)),
        changeFormatted: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(2)}%`,
        direction: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'flat',
        caption: 'vs last month',
        meta: { previous: prevRev, previousFormatted: safeCurrencyFormat(prevRev) }
      },
      {
        key: 'activeTenants',
        title: 'Active Tenants',
        value: activeTenants,
        valueFormatted: activeTenants.toString(),
        changePercent: Number(tenantGrowth.toFixed(2)),
        changeFormatted: `${tenantGrowth >= 0 ? '+' : ''}${tenantGrowth.toFixed(2)}%`,
        direction: tenantGrowth > 0 ? 'up' : tenantGrowth < 0 ? 'down' : 'flat',
        caption: 'vs last month'
      },
      {
        key: 'activeVendors',
        title: 'Active Vendors',
        value: activeVendors,
        valueFormatted: activeVendors.toString(),
        changePercent: Number(vendorGrowth.toFixed(2)),
        changeFormatted: `${vendorGrowth >= 0 ? '+' : ''}${vendorGrowth.toFixed(2)}%`,
        direction: vendorGrowth > 0 ? 'up' : vendorGrowth < 0 ? 'down' : 'flat',
        caption: 'vs last month'
      }
    ];

    const overview = {
      occupancy: {
        occupied: Number(occupancyRate.toFixed(2)),
        vacant: Number((100 - occupancyRate).toFixed(2)),
        occupiedPercent: Number(occupancyRate.toFixed(2)),
        vacantPercent: Number((100 - occupancyRate).toFixed(2)),
        growth: `${occGrowth.toFixed(2)}%`,
        totalUnits,
        occupiedUnits
      },
      monthlyRevenue: {
        current: currRev,
        growth: `${revenueGrowth.toFixed(2)}%`,
        formatted: safeCurrencyFormat(currRev)
      },
      activeTenants: {
        count: activeTenants,
        growth: `${tenantGrowth.toFixed(2)}%`
      },
      activeVendors: {
        count: activeVendors,
        growth: `${vendorGrowth.toFixed(2)}%`
      },
      openAlerts: {
        count: openAlerts,
        growth: `${alertGrowth.toFixed(2)}%`
      },
      pendingPayments: {
        count: pendingPayments,
        growth: `${pendingGrowth.toFixed(2)}%`
      }
    };

    const dashboard = {
      summaryCards,
      overview,
      profitLoss: {
        totalNetIncome,
        series: profitLossSeries
      },
      employeeActivityLog: {
        total: formattedActivityLog.length,
        items: formattedActivityLog
      },
      transactions: {
        payable: {
          totalAmount: sumAmount(payablePayments),
          totalFormatted: safeCurrencyFormat(sumAmount(payablePayments)),
          count: payablePayments.length,
          items: payablePayments
        },
        receivable: {
          totalAmount: sumAmount(receivablePayments),
          totalFormatted: safeCurrencyFormat(sumAmount(receivablePayments)),
          count: receivablePayments.length,
          items: receivablePayments
        }
      },
      recentBills,
      recentMaintenance,
      unpaidRent,
      checkInCheckOut,
      meta: {
        hostelId: hostelIdNum,
        currency: DASHBOARD_CURRENCY,
        generatedAt: now.toISOString()
      }
    };

    // Cache the result for 10 minutes
    await setCache(cacheKey, dashboard, 600);

    return successResponse(res, dashboard, 'Dashboard data fetched successfully', 200);
  } catch (err) {
    console.error('Dashboard Overview Error:', err);
    return errorResponse(res, err.message || 'Failed to fetch dashboard data', 500);
  }
};

module.exports = { getDashboardOverview, invalidateDashboardCache };
