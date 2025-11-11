const { prisma } = require('../../../config/db');
const { successResponse, errorResponse } = require('../../../Helper/helper');

// ---- lightweight cache (uses utils/cache if you added it; otherwise in-memory) ----
let memoryCache = {};
let setCache = async (k, v, ttl = 600) => (memoryCache[k] = { v, exp: Date.now() + ttl * 1000 });
let getCache = async (k) => {
  const hit = memoryCache[k];
  if (!hit) return null;
  if (hit.exp < Date.now()) { delete memoryCache[k]; return null; }
  return hit.v;
};
let delCache = async (k) => { delete memoryCache[k]; };
try {
  // if you created utils/cache.js earlier, we'll use it automatically
  const wired = require('../../utils/cache'); // { setCache, getCache }
  setCache = wired.setCache || setCache;
  getCache = wired.getCache || getCache;
  delCache = wired.delCache || delCache;
} catch(_) {}

const startOfMonth = (y, m) => new Date(y, m - 1, 1, 0, 0, 0, 0);
const startOfNextMonth = (y, m) => (m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1));
const prevMonthPair = (y, m) => (m === 1 ? [y - 1, 12] : [y, m - 1]);

const DASHBOARD_CURRENCY = process.env.DASHBOARD_CURRENCY || 'USD';

const safeCurrencyFormat = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: DASHBOARD_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  } catch (err) {
    // Fallback to plain number formatting if currency code is invalid
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

// Invalidate from other controllers when payments/allocations/tenants/vendors change
const invalidateDashboardCache = async (hostelId) => {
  const key = `dash_overview_${hostelId || 'all'}`;
  await delCache(key);
};

const getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const { hostelId } = req.query;               // optional filter
    const hostelIdNum = hostelId ? Number(hostelId) : null;
    const cacheKey = `dash_overview_${hostelIdNum || 'all'}`;

    const cached = await getCache(cacheKey);
    if (cached) return successResponse(res, cached, 'Dashboard data (cached)');

    const currFrom = startOfMonth(year, month);
    const currTo   = startOfNextMonth(year, month);
    const [py, pm] = prevMonthPair(year, month);
    const prevFrom = startOfMonth(py, pm);
    const prevTo   = startOfNextMonth(py, pm);

    // ---------- Filters ----------
    const hostelf = hostelIdNum ? { hostelId: hostelIdNum } : {};

    // 1) OCCUPANCY (prefer Beds; fallback Rooms)
    const totalUnits = prisma.bed?.count
      ? await prisma.bed.count(hostelIdNum ? { where: hostelf } : {})
      : await prisma.room.count(hostelIdNum ? { where: hostelf } : {});

    const occupiedUnits = await prisma.allocation.count({
      where: { status: 'active', ...(hostelIdNum && hostelf) }
    });

    const occupancyRate = totalUnits ? (occupiedUnits / totalUnits) * 100 : 0;

    // last month occupancy proxy = new active allocations created last month / totalUnits
    const lastMonthAllocs = await prisma.allocation.count({
      where: { createdAt: { gte: prevFrom, lt: prevTo }, ...(hostelIdNum && hostelf) }
    });
    const lastMonthOcc = totalUnits ? (lastMonthAllocs / totalUnits) * 100 : 0;
    const occGrowth = lastMonthOcc > 0 ? ((occupancyRate - lastMonthOcc) / lastMonthOcc) * 100
                                       : (occupancyRate > 0 ? 100 : 0);

    // 2) MONTHLY REVENUE (current vs last month)
    const [currentRevenue, lastRevenue] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid', paymentDate: { gte: currFrom, lt: currTo }, ...(hostelIdNum && hostelf) }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid', paymentDate: { gte: prevFrom, lt: prevTo }, ...(hostelIdNum && hostelf) }
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
      prisma.alert.count({ where: { status: 'open', ...(hostelIdNum && hostelf) } }),
      prisma.alert.count({
        where: {
          status: 'open',
          createdAt: { lt: currFrom },
          ...(hostelIdNum && hostelf)
        }
      }),
      prisma.payment.count({ where: { status: 'pending', ...(hostelIdNum && hostelf) } }),
      prisma.payment.count({
        where: {
          status: 'pending',
          createdAt: { lt: currFrom },
          ...(hostelIdNum && hostelf)
        }
      })
    ]);

    const growth = (c, p) => (p > 0 ? ((c - p) / p) * 100 : (c > 0 ? 100 : 0));
    const tenantGrowth  = growth(activeTenants,  lastTenants);
    const vendorGrowth  = growth(activeVendors,  lastVendors);
    const alertGrowth   = growth(openAlerts,     lastAlerts);
    const pendingGrowth = growth(pendingPayments, lastPendingPayments);

    // 4) PROFIT & LOSS (last 3 FPA rows)
    const fpaRecords = await prisma.fPA.findMany({
      where: hostelId ? hostelf : {},
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 3
    });
    const profitLossSeries = fpaRecords.reverse().map(f => ({
      month: f.month,
      year: f.year,
      revenue: f.totalIncome || 0,
      expenses: f.totalExpense || 0,
      netIncome: f.profit || 0
    }));
    const totalNetIncome = profitLossSeries.reduce((a, r) => a + r.netIncome, 0);

    // 5) EMPLOYEE/USER ACTIVITY LOG (latest)
    const activityLog = await prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            employeeProfile: {
              select: {
                designation: true,
                department: true
              }
            }
          }
        }
      }
    });

    const formattedActivityLog = activityLog.map((entry) => ({
      id: entry.id,
      actor: entry.user?.name || 'System',
      role: entry.user?.employeeProfile?.designation
        || toTitleCase(entry.user?.role)
        || 'Staff',
      action: entry.action,
      module: entry.module,
      description: entry.description,
      createdAt: entry.createdAt,
      relativeTime: relativeTimeFromNow(entry.createdAt)
    }));

    // 6) PAYABLE (outgoing) & RECEIVABLE (incoming) payment snapshots
    const [payablePaymentsRaw, receivablePaymentsRaw] = await Promise.all([
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        where: { status: { in: ['pending', 'partial', 'overdue'] }, ...(hostelIdNum && hostelf) },
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
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        where: { status: 'paid', ...(hostelIdNum && hostelf) },
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
        tenantName: payment.tenant?.name || 'N/A',
        paymentType: payment.paymentType || 'rent',
        paymentTypeLabel: toTitleCase(payment.paymentType || 'rent'),
        amount: payment.amount || 0,
        amountFormatted: safeCurrencyFormat(payment.amount || 0),
        status: payment.status,
        hostelName: payment.hostel?.name || null,
        roomNumber,
        receiptNumber: payment.receiptNumber || `PAY-${String(payment.id).padStart(4, '0')}`,
        paymentDate: baseDate,
        relativeTime: relativeTimeFromNow(baseDate)
      };
    };

    const payablePayments = payablePaymentsRaw.map(mapPaymentRow);
    const receivablePayments = receivablePaymentsRaw.map(mapPaymentRow);

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
        occupied: occupancyRate.toFixed(2),
        vacant: (100 - occupancyRate).toFixed(2),
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
      meta: {
        hostelId: hostelIdNum,
        currency: DASHBOARD_CURRENCY,
        generatedAt: now.toISOString()
      }
    };

    await setCache(cacheKey, dashboard, 600);  // 10 min
    return successResponse(res, dashboard, 'Dashboard data fetched successfully');
  } catch (err) {
    console.error('Dashboard Error:', err);
    return errorResponse(res, err.message);
  }
};

module.exports = { getDashboardOverview, invalidateDashboardCache };
