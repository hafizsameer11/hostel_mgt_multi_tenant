const { prisma } = require('../../../config/db');
const { successResponse, errorResponse } = require('../../../Helper/helper');

/* ----------------------------- helpers ----------------------------- */

const paged = (page = 1, limit = 12) => {
  const p = parseInt(page) || 1;
  const l = Math.min(parseInt(limit) || 12, 100);
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const clamp0to5 = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(5, x));
};

const overallFrom = (...vals) => {
  const arr = vals.map(clamp0to5);
  const sum = arr.reduce((a, b) => a + b, 0);
  return +(sum / arr.length).toFixed(1);
};

const briefAddress = (addr) => {
  if (!addr) return null;
  try {
    const a = typeof addr === 'string' ? JSON.parse(addr) : addr;
    return [a.line1, a.city, a.state].filter(Boolean).join(', ');
  } catch {
    return null;
  }
};

const parseDocuments = (docs) => {
  if (!docs) return [];
  if (Array.isArray(docs)) return docs;
  try {
    const parsed = typeof docs === 'string' ? JSON.parse(docs) : docs;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildUploads = (profilePhoto, docs) => ({
  profilePhoto: profilePhoto || null,
  documents: parseDocuments(docs),
});

/* -------------------------- list (cards) --------------------------- */

/**
 * GET /api/admin/people/tenants
 * ?hostelId= &status=active|inactive|blacklisted &search= &page= &limit=
 */
const listTenants = async (req, res) => {
  try {
    const { hostelId, status, search, page, limit } = req.query;
    const { skip, take } = paged(page, limit);

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { cnicNumber: { contains: search } },
            ],
          }
        : {}),
      ...(hostelId
        ? {
            allocations: {
              some: { hostelId: Number(hostelId), status: 'active' },
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          profilePhoto: true,
          address: true,
          userId: true,
          leaseStartDate: true,
          leaseEndDate: true,
          monthlyRent: true,
          securityDeposit: true,
          documents: true,
          allocations: {
            where: { status: 'active' },
            select: {
              id: true,
              hostelId: true,
              createdAt: true,
              hostel: { select: { name: true } },
            },
            take: 1,
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    // Get bed/room info for tenants with active allocations
    const tenantIdsWithAllocations = rows
      .filter(t => t.allocations[0] && t.userId)
      .map(t => ({ tenantId: t.id, userId: t.userId, allocation: t.allocations[0] }));

    const bedInfoMap = {};
    if (tenantIdsWithAllocations.length > 0) {
      const userIds = tenantIdsWithAllocations.map(t => t.userId);
      const beds = await prisma.bed.findMany({
        where: {
          currentUserId: { in: userIds },
          status: 'occupied',
        },
        select: {
          id: true,
          number: true,
          currentUserId: true,
          room: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      beds.forEach(bed => {
        const tenant = tenantIdsWithAllocations.find(t => t.userId === bed.currentUserId);
        if (tenant) {
          bedInfoMap[tenant.tenantId] = {
            roomNumber: bed.room.number,
            bedNumber: bed.number,
          };
        }
      });
    }

    const cards = rows.map((t) => {
      const bedInfo = bedInfoMap[t.id];
      const allocation = t.allocations[0];
      const documentList = parseDocuments(t.documents);
      
      let location = briefAddress(t.address);
      if (allocation && bedInfo) {
        location = `Room ${bedInfo.roomNumber}-${bedInfo.bedNumber}`;
      } else if (allocation && allocation.hostel) {
        location = allocation.hostel.name;
      }

      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        avatar: t.profilePhoto,
        status: t.status === 'active' ? 'Active' : t.status === 'inactive' ? 'Inactive' : t.status,
        room: bedInfo ? `Room ${bedInfo.roomNumber}-${bedInfo.bedNumber}` : null,
        documents: documentList,
        uploads: buildUploads(t.profilePhoto, t.documents),
        lease: {
          startDate: t.leaseStartDate ? t.leaseStartDate.toISOString().split('T')[0] : null,
          endDate: t.leaseEndDate ? t.leaseEndDate.toISOString().split('T')[0] : null,
          monthlyRent: t.monthlyRent ?? null,
          deposit: typeof t.securityDeposit === 'number' ? t.securityDeposit : null,
        },
      };
    });

    return successResponse(res, {
      items: cards,
      total,
    });
  } catch (e) {
    console.error('List tenants error:', e);
    return errorResponse(res, e.message);
  }
};

/**
 * GET /api/admin/people/employees
 * ?status=active|inactive &search= &page= &limit=
 */
const listEmployees = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const { skip, take } = paged(page, limit);

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { username: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { user: { phone: { contains: search } } },
              { employeeCode: { contains: search, mode: 'insensitive' } },
              { designation: { contains: search, mode: 'insensitive' } },
              { department: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    const hostelIds = Array.from(
      new Set(
        rows
          .map((emp) => emp.hostelAssigned)
          .filter((id) => typeof id === 'number' && !Number.isNaN(id)),
      ),
    );

    const hostels = hostelIds.length
      ? await prisma.hostel.findMany({
          where: { id: { in: hostelIds } },
          select: { id: true, name: true },
        })
      : [];
    const hostelMap = hostels.reduce((acc, hostel) => {
      acc[hostel.id] = hostel.name;
      return acc;
    }, {});

    const cards = rows.map((e) => {
      const hostelId = e.hostelAssigned ?? null;
      const hostelName = hostelId ? hostelMap[hostelId] ?? null : null;

      return {
        id: e.id,
        userId: e.user?.id ?? null,
        name: e.user?.name ?? null,
        username: e.user?.username ?? null,
        email: e.user?.email ?? null,
        phone: e.user?.phone ?? null,
        role: e.role,
        userRole: e.user?.role ?? null,
        status: e.status === 'active' ? 'Active' : e.status === 'inactive' ? 'Inactive' : e.status,
        avatar: e.profilePhoto ?? null,
        joinedAt: e.joinDate ? e.joinDate.toISOString().split('T')[0] : null,
        salary: typeof e.salary === 'number' ? e.salary : null,
        hostel: hostelId
          ? {
              id: hostelId,
              name: hostelName,
            }
          : null,
      };
    });

    return successResponse(res, { items: cards, total });
  } catch (e) {
    console.error('List employees error:', e);
    return errorResponse(res, e.message);
  }
};

/* ----------------------------- details ---------------------------- */

/**
 * GET /api/admin/people/tenant/:id
 * (modal → Details tab)
 */
const tenantDetails = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        allocations: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            hostelId: true,
            createdAt: true,
            hostel: { select: { name: true } },
          },
        },
        _count: { select: { payments: true, allocations: true } },
      },
    });

    if (!tenant) return errorResponse(res, 'Tenant not found', 404);

    // Get bed/room info if tenant has userId and active allocation
    let bedInfo = null;
    let roomBed = null;
    if (tenant.userId && tenant.allocations[0]) {
      const bed = await prisma.bed.findFirst({
        where: {
          currentUserId: tenant.userId,
          status: 'occupied',
        },
        select: {
          id: true,
          number: true,
          room: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      if (bed) {
        bedInfo = bed;
        roomBed = `Room ${bed.room.number}-${bed.number}`;
      }
    }

    // Get lease dates from allocation (using createdAt as lease start)
    const allocation = tenant.allocations[0];
    let leaseStart = tenant.leaseStartDate || (allocation ? allocation.createdAt : null);
    // For lease end, prefer explicit lease, else fallback to booking/default
    let leaseEnd = tenant.leaseEndDate || null;
    if (!leaseEnd && tenant.userId) {
      const booking = await prisma.booking.findFirst({
        where: {
          tenantId: id,
          status: { not: 'cancelled' },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          checkOut: true,
        },
      });
      if (booking && booking.checkOut) {
        leaseEnd = booking.checkOut;
      } else if (leaseStart) {
        // Default to 6 months from lease start if no checkout date
        const endDate = new Date(leaseStart);
        endDate.setMonth(endDate.getMonth() + 6);
        leaseEnd = endDate;
      }
    }

    // Try to get current score (using ScoreCard model if TenantScore doesn't exist)
    let currentScore = null;
    try {
      currentScore = await prisma.scoreCard.findFirst({
        where: {
          entityType: 'tenant',
          entityId: id,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          score: true,
          criteria: true,
          remarks: true,
          createdAt: true,
        },
      });
    } catch (e) {
      // ScoreCard might not exist, that's okay
      console.log('ScoreCard query failed:', e.message);
    }

    const tenantDocuments = parseDocuments(tenant.documents);

    return successResponse(res, {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      status: tenant.status === 'active' ? 'Active' : tenant.status === 'inactive' ? 'Inactive' : tenant.status,
      profilePhoto: tenant.profilePhoto,
      address: tenant.address,
      roomBed: roomBed,
      leaseStart: leaseStart ? leaseStart.toISOString().split('T')[0] : null,
      leaseEnd: leaseEnd ? leaseEnd.toISOString().split('T')[0] : null,
      documents: tenantDocuments,
      uploads: buildUploads(tenant.profilePhoto, tenant.documents),
      lease: {
        startDate: leaseStart ? leaseStart.toISOString().split('T')[0] : null,
        endDate: leaseEnd ? leaseEnd.toISOString().split('T')[0] : null,
        monthlyRent: tenant.monthlyRent ?? null,
        deposit: tenant.securityDeposit ?? null,
      },
      allocation: allocation
        ? {
            hostel: allocation.hostel.name,
            room: bedInfo ? bedInfo.room.number : null,
            bed: bedInfo ? bedInfo.number : null,
          }
        : null,
      counts: tenant._count,
      score: currentScore,
    });
  } catch (e) {
    console.error('Tenant details error:', e);
    return errorResponse(res, e.message);
  }
};

/**
 * GET /api/admin/people/employee/:id
 */
const employeeDetails = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
    if (!emp) return errorResponse(res, 'Employee not found', 404);

    let hostel = null;
    if (emp.hostelAssigned) {
      hostel = await prisma.hostel.findUnique({
        where: { id: emp.hostelAssigned },
        select: { id: true, name: true, address: true },
      });
    }

    const employeeDocuments = parseDocuments(emp.documents);

    // Try to get current score (using ScoreCard model)
    let currentScore = null;
    try {
      currentScore = await prisma.scoreCard.findFirst({
        where: {
          entityType: 'employee',
          entityId: id,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          score: true,
          criteria: true,
          remarks: true,
          createdAt: true,
        },
      });
    } catch (e) {
      console.log('ScoreCard query failed:', e.message);
    }
    const formattedStatus =
      emp.status === 'active' ? 'Active' : emp.status === 'inactive' ? 'Inactive' : emp.status;

    return successResponse(res, {
      id: emp.id,
      userId: emp.userId,
      name: emp.user?.name ?? null,
      username: emp.user?.username ?? null,
      email: emp.user?.email ?? null,
      phone: emp.user?.phone ?? null,
      role: emp.role,
      userRole: emp.user?.role ?? null,
      status: formattedStatus,
      profilePhoto: emp.profilePhoto ?? null,
      avatar: emp.profilePhoto ?? null,
      joinDate: emp.joinDate ? emp.joinDate.toISOString().split('T')[0] : null,
      terminationDate: emp.terminationDate
        ? emp.terminationDate.toISOString().split('T')[0]
        : null,
      department: emp.department ?? null,
      designation: emp.designation ?? null,
      employeeCode: emp.employeeCode ?? null,
      salary: typeof emp.salary === 'number' ? emp.salary : null,
      salaryType: emp.salaryType ?? null,
      workingHours: emp.workingHours ?? null,
      hostel: hostel
        ? {
            id: hostel.id,
            name: hostel.name,
            address: hostel.address ?? null,
          }
        : emp.hostelAssigned
        ? { id: emp.hostelAssigned, name: null, address: null }
        : null,
      bankDetails: emp.bankDetails ?? null,
      address: emp.address ?? null,
      emergencyContact: emp.emergencyContact ?? null,
      qualifications: emp.qualifications ?? null,
      notes: emp.notes ?? null,
      documents: employeeDocuments,
      uploads: buildUploads(emp.profilePhoto, emp.documents),
      score: currentScore,
    });
  } catch (e) {
    console.error('Employee details error:', e);
    return errorResponse(res, e.message);
  }
};

/* --------------------------- score: tenant ------------------------ */

/**
 * GET /api/admin/people/tenant/:id/score
 * (current / latest)
 */
const getTenantCurrentScore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const score = await prisma.scoreCard.findFirst({
      where: {
        entityType: 'tenant',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, score || null);
  } catch (e) {
    console.error('Get tenant score error:', e);
    return errorResponse(res, e.message);
  }
};

/**
 * GET /api/admin/people/tenant/:id/scores?limit=10
 */
const getTenantScoreHistory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const rows = await prisma.scoreCard.findMany({
      where: {
        entityType: 'tenant',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return successResponse(res, rows);
  } catch (e) {
    console.error('Get tenant score history error:', e);
    return errorResponse(res, e.message);
  }
};

/**
 * POST /api/admin/people/tenant/:id/score
 * { behavior, punctuality, cleanliness, remarks? }
 */
const upsertTenantScore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { behavior, punctuality, cleanliness, remarks } = req.body;

    const overall = overallFrom(behavior, punctuality, cleanliness);
    const payload = {
      entityType: 'tenant',
      entityId: id,
      score: overall,
      criteria: JSON.stringify({ behavior, punctuality, cleanliness }),
      remarks: remarks || null,
      recordedBy: req.user?.id || null,
    };

    const row = await prisma.scoreCard.create({ data: payload });
    return successResponse(res, {
      ...row,
      behavior: clamp0to5(behavior),
      punctuality: clamp0to5(punctuality),
      cleanliness: clamp0to5(cleanliness),
      overall: overall,
    }, 'Tenant score saved');
  } catch (e) {
    console.error('Upsert tenant score error:', e);
    return errorResponse(res, e.message);
  }
};

/* -------------------------- score: employee ----------------------- */

const getEmployeeCurrentScore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const score = await prisma.scoreCard.findFirst({
      where: {
        entityType: 'employee',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, score || null);
  } catch (e) {
    console.error('Get employee score error:', e);
    return errorResponse(res, e.message);
  }
};

const getEmployeeScoreHistory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const rows = await prisma.scoreCard.findMany({
      where: {
        entityType: 'employee',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return successResponse(res, rows);
  } catch (e) {
    console.error('Get employee score history error:', e);
    return errorResponse(res, e.message);
  }
};

/**
 * POST /api/admin/people/employee/:id/score
 * { behavior, punctuality, taskQuality, remarks? }
 */
const upsertEmployeeScore = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { behavior, punctuality, taskQuality, remarks } = req.body;

    const overall = overallFrom(behavior, punctuality, taskQuality);
    const payload = {
      entityType: 'employee',
      entityId: id,
      score: overall,
      criteria: JSON.stringify({ behavior, punctuality, taskQuality }),
      remarks: remarks || null,
      recordedBy: req.user?.id || null,
    };

    const row = await prisma.scoreCard.create({ data: payload });
    return successResponse(res, {
      ...row,
      behavior: clamp0to5(behavior),
      punctuality: clamp0to5(punctuality),
      taskQuality: clamp0to5(taskQuality),
      overall: overall,
    }, 'Employee score saved');
  } catch (e) {
    console.error('Upsert employee score error:', e);
    return errorResponse(res, e.message);
  }
};

module.exports = {
  // lists
  listTenants,
  listEmployees,
  // detail
  tenantDetails,
  employeeDetails,
  // tenant scores
  getTenantCurrentScore,
  getTenantScoreHistory,
  upsertTenantScore,
  // employee scores
  getEmployeeCurrentScore,
  getEmployeeScoreHistory,
  upsertEmployeeScore,
};
