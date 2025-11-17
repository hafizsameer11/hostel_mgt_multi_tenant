const { prisma } = require('../../config/db');
const { successResponse, errorResponse } = require('../../Helper/helper');

const paged = (page = 1, limit = 12, max = 100) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(parseInt(limit, 10) || 12, max);
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

const parseId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const iso = (date) => (date ? new Date(date).toISOString() : null);

const buildSearchFilter = (fields, term) => {
  if (!term) return undefined;
  const q = term.trim();
  if (!q) return undefined;
  return fields.map((field) => ({ [field]: { contains: q, mode: 'insensitive' } }));
};

const mapTenantCard = (tenant, bedMap) => {
  const activeAllocation = tenant.allocations[0] || null;
  const latestBooking = tenant.bookings[0] || null;
  const bedInfo = tenant.userId ? bedMap[tenant.userId] : null;

  let roomLabel = null;
  if (bedInfo) {
    roomLabel = bedInfo.roomNumber ? `Room ${bedInfo.roomNumber}-${bedInfo.bedNumber}` : `Bed ${bedInfo.bedNumber}`;
  } else if (latestBooking?.room?.roomNumber) {
    roomLabel = `Room ${latestBooking.room.roomNumber}`;
  }

  return {
    id: tenant.id,
    name: tenant.name,
    status: tenant.status,
    email: tenant.email,
    phone: tenant.phone,
    avatar: tenant.profilePhoto,
    hostel: activeAllocation?.hostel || null,
    room: roomLabel,
    leaseStart: iso(latestBooking?.checkInDate) || iso(activeAllocation?.createdAt),
    leaseEnd: iso(latestBooking?.checkOutDate) || null,
    createdAt: iso(tenant.createdAt),
  };
};
const nodemailer = require('nodemailer');

const sendEmailCampaign = async (req, res) => {
  try {
    const { audience, subject, message, ids } = req.body;

    if (!audience || !subject || !message) {
      return errorResponse(res, "audience, subject, and message are required", 400);
    }

    let recipients = [];

    if (audience === "vendors") {
      recipients = await prisma.vendor.findMany({
        where: {
          ...(Array.isArray(ids) && ids.length > 0
            ? { id: { in: ids } }
            : {}),
          email: { not: null }
        },
        select: { id: true, name: true, email: true }
      });
    }

    else if (audience === "employees") {
      recipients = await prisma.employee.findMany({
        where: {
          ...(Array.isArray(ids) && ids.length > 0
            ? { id: { in: ids } }
            : {}),
          user: { email: { not: null } }
        },
        select: {
          id: true,
          user: { select: { email: true, username: true } }
        }
      });
    }

    else if (audience === "tenants") {
      recipients = await prisma.tenant.findMany({
        where: {
          ...(Array.isArray(ids) && ids.length > 0
            ? { id: { in: ids } }
            : {}),
          email: { not: null }
        },
        select: { id: true, name: true, email: true }
      });
    }

    else {
      return errorResponse(res, "Invalid audience type", 400);
    }

    if (recipients.length === 0) {
      return errorResponse(res, "No valid recipients found", 404);
    }

    // ------------------------------
    // SMTP Transport Setup (Gmail / SMTP)
    // ------------------------------
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const r of recipients) {
      const email = 
        r.email ||
        r.user?.email ||
        null;

      if (!email) continue;

      try {
        await transporter.sendMail({
          from: `"Hostel Management" <${process.env.SMTP_USER}>`,
          to: email,
          subject,
          html: `
            <p>${message.replace(/\n/g, "<br>")}</p>
            <hr>
            <small>This email was sent via Hostel Management System</small>
          `
        });
        success++;
      } catch (err) {
        failed++;
        errors.push({
          recipient: email,
          error: err.message
        });
      }
    }

    return successResponse(res, {
      audience,
      attempted: recipients.length,
      success,
      failed,
      errors,
    }, "Email campaign completed");

  } catch (error) {
    console.error("Email campaign error:", error);
    return errorResponse(res, "Failed to send campaign email");
  }
};


const tenantContacts = async (req, res) => {
  try {
    const { status, hostelId, search, page = 1, limit = 12 } = req.query;
    const filters = {};

    if (status) filters.status = status;

    if (hostelId) {
      const hostelNumeric = parseId(hostelId);
      if (!hostelNumeric) return errorResponse(res, 'hostelId must be numeric', 400);
      filters.allocations = {
        some: { status: 'active', hostelId: hostelNumeric },
      };
    }

    const searchFilter = buildSearchFilter(['name', 'email', 'phone'], search);

    const { skip, take, page: currentPage, limit: pageSize } = paged(page, limit);

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where: {
          ...filters,
          ...(searchFilter ? { OR: searchFilter } : {}),
        },
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
          userId: true,
          createdAt: true,
          allocations: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              createdAt: true,
              hostel: { select: { id: true, name: true } },
            },
          },
          bookings: {
            where: { status: { not: 'cancelled' } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              checkInDate: true,
              checkOutDate: true,
              room: { select: { roomNumber: true } },
            },
          },
        },
      }),
      prisma.tenant.count({
        where: {
          ...filters,
          ...(searchFilter ? { OR: searchFilter } : {}),
        },
      }),
    ]);

    const userIds = tenants.map((t) => t.userId).filter(Boolean);
    const bedMap = {};

    if (userIds.length) {
      const beds = await prisma.bed.findMany({
        where: {
          currentTenantId: { in: userIds },
          status: 'occupied',
        },
        select: {
          currentTenantId: true,
          number: true,
          room: { select: { roomNumber: true } },
        },
      });

      beds.forEach((bed) => {
        bedMap[bed.currentTenantId] = {
          bedNumber: bed.number,
          roomNumber: bed.room?.roomNumber || null,
        };
      });
    }

    const items = tenants.map((tenant) => mapTenantCard(tenant, bedMap));

    return successResponse(res, {
      items,
      total,
      pagination: {
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }, 'Tenant contacts fetched successfully');
  } catch (error) {
    console.error('Tenant contacts error:', error);
    return errorResponse(res, 'Failed to fetch tenant contacts');
  }
};

const tenantContactDetails = async (req, res) => {
  try {
    const tenantId = parseId(req.params.id);
    if (!tenantId) return errorResponse(res, 'Valid tenant id is required', 400);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        profilePhoto: true,
        occupation: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        userId: true,
        createdAt: true,
        allocations: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            hostel: { select: { id: true, name: true } },
          },
        },
        bookings: {
          where: { status: { notIn: ['cancelled'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            checkInDate: true,
            checkOutDate: true,
            room: { select: { roomNumber: true } },
            hostel: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!tenant) return errorResponse(res, 'Tenant not found', 404);

    const bed = tenant.userId
      ? await prisma.bed.findFirst({
          where: { currentTenantId: tenant.userId, status: 'occupied' },
          select: {
            number: true,
            room: { select: { roomNumber: true } },
          },
        })
      : null;

    const payments = await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { paymentDate: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        paymentType: true,
        paymentMethod: true,
        paymentDate: true,
        status: true,
        receiptNumber: true,
      },
    });

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return successResponse(res, {
      profile: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        status: tenant.status,
        avatar: tenant.profilePhoto,
        occupation: tenant.occupation,
        gender: tenant.gender,
        dateOfBirth: iso(tenant.dateOfBirth),
        address: tenant.address,
        hostel: tenant.allocations[0]?.hostel || tenant.bookings[0]?.hostel || null,
        room: bed?.room?.roomNumber || tenant.bookings[0]?.room?.roomNumber || null,
        bed: bed?.number || null,
        leaseStart: iso(tenant.bookings[0]?.checkInDate) || iso(tenant.allocations[0]?.createdAt),
        leaseEnd: iso(tenant.bookings[0]?.checkOutDate) || null,
        joinedAt: iso(tenant.createdAt),
      },
      payments: {
        total: payments.length,
        totalAmount,
        recent: payments,
      },
    }, 'Tenant contact details fetched successfully');
  } catch (error) {
    console.error('Tenant contact details error:', error);
    return errorResponse(res, 'Failed to fetch tenant contact details');
  }
};

const employeeContacts = async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 12 } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (department) filters.department = department;

    // Build search filter for employee and user fields
    let searchFilter = undefined;
    if (search) {
      const q = search.trim();
      if (q) {
        searchFilter = {
          OR: [
            { department: { contains: q, mode: 'insensitive' } },
            { designation: { contains: q, mode: 'insensitive' } },
            { role: { contains: q, mode: 'insensitive' } },
            { user: { 
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
              ]
            } },
          ],
        };
      }
    }

    const { skip, take, page: currentPage, limit: pageSize } = paged(page, limit);

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: {
          ...filters,
          ...(searchFilter || {}),
        },
        orderBy: { joinDate: 'desc' },
        skip,
        take,
        select: {
          id: true,
          role: true,
          department: true,
          designation: true,
          status: true,
          joinDate: true,
          profilePhoto: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              username: true,
            },
          },
        },
      }),
      prisma.employee.count({
        where: {
          ...filters,
          ...(searchFilter || {}),
        },
      }),
    ]);

    const items = employees.map((employee) => ({
      id: employee.id,
      name: employee.user?.username || `Employee ${employee.id}`,
      email: employee.user?.email || null,
      phone: employee.user?.phone || null,
      role: employee.role,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      avatar: employee.profilePhoto,
      joinedAt: iso(employee.joinDate),
    }));

    return successResponse(res, {
      items,
      total,
      pagination: {
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }, 'Employee contacts fetched successfully');
  } catch (error) {
    console.error('Employee contacts error:', error);
    return errorResponse(res, 'Failed to fetch employee contacts');
  }
};

const employeeContactDetails = async (req, res) => {
  try {
    const employeeId = parseId(req.params.id);
    if (!employeeId) return errorResponse(res, 'Valid employee id is required', 400);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        role: true,
        department: true,
        designation: true,
        status: true,
        joinDate: true,
        salary: true,
        salaryType: true,
        workingHours: true,
        hostelAssigned: true,
        address: true,
        emergencyContact: true,
        qualifications: true,
        profilePhoto: true,
        notes: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            username: true,
          },
        },
      },
    });

    if (!employee) return errorResponse(res, 'Employee not found', 404);

    const scoreAggregate = await prisma.scoreCard.aggregate({
      where: { entityType: 'employee', entityId: employeeId },
      _avg: { score: true },
      _count: { _all: true },
      _max: { createdAt: true },
    });

    const score = scoreAggregate?._count?._all
      ? {
          average: Number((scoreAggregate._avg.score || 0).toFixed(1)),
          totalReviews: scoreAggregate._count._all,
          lastRecordedAt: iso(scoreAggregate._max.createdAt),
        }
      : null;

    return successResponse(res, {
      profile: {
        id: employee.id,
        name: employee.user?.username || `Employee ${employee.id}`,
        email: employee.user?.email || null,
        phone: employee.user?.phone || null,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        status: employee.status,
        joinedAt: iso(employee.joinDate),
        avatar: employee.profilePhoto,
        salary: employee.salary,
        salaryType: employee.salaryType,
        workingHours: employee.workingHours,
        hostelAssigned: employee.hostelAssigned,
        address: employee.address,
        emergencyContact: employee.emergencyContact,
        qualifications: employee.qualifications,
        notes: employee.notes,
      },
      score,
    }, 'Employee contact details fetched successfully');
  } catch (error) {
    console.error('Employee contact details error:', error);
    return errorResponse(res, 'Failed to fetch employee contact details');
  }
};

const vendorContacts = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 12 } = req.query;
    const filters = {};
    if (status) filters.status = status.toLowerCase();

    const searchFilter = buildSearchFilter(['name', 'companyName', 'email', 'phone', 'category'], search);
    const { skip, take, page: currentPage, limit: pageSize } = paged(page, limit);

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: {
          ...filters,
          ...(searchFilter ? { OR: searchFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
          category: true,
          services: true,
          paymentTerms: true,
          totalPayable: true,
          totalPaid: true,
          balance: true,
          createdAt: true,
        },
      }),
      prisma.vendor.count({
        where: {
          ...filters,
          ...(searchFilter ? { OR: searchFilter } : {}),
        },
      }),
    ]);

    // Get vendor IDs for batch fetching ratings and last invoices
    const vendorIds = vendors.map((v) => v.id);

    // Fetch ratings for all vendors
    const ratingMap = {};
    if (vendorIds.length > 0) {
      const scoreAggregates = await prisma.scoreCard.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'vendor',
          entityId: { in: vendorIds },
        },
        _avg: { score: true },
        _count: { _all: true },
      });

      scoreAggregates.forEach((agg) => {
        ratingMap[agg.entityId] = {
          average: Number((agg._avg?.score || 0).toFixed(1)),
          totalReviews: agg._count?._all || 0,
        };
      });
    }

    // Fetch last invoice dates from Expense model (if vendorId exists) or use updatedAt
    // Note: Expense model doesn't have vendorId, so we'll use updatedAt as lastInvoice
    // If you have a different model for vendor invoices, update this accordingly
    const lastInvoiceMap = {};
    vendors.forEach((vendor) => {
      // Using updatedAt as lastInvoice since Expense doesn't link to vendors
      // You may need to create a VendorInvoice model or add vendorId to Expense
      lastInvoiceMap[vendor.id] = iso(vendor.createdAt); // Fallback to createdAt
    });

    const items = vendors.map((vendor) => {
      const rating = ratingMap[vendor.id];
      const services = Array.isArray(vendor.services) ? vendor.services : 
                      (typeof vendor.services === 'string' ? JSON.parse(vendor.services || '[]') : []);
      const primaryService = services[0] || vendor.category || null;

      return {
        id: vendor.id,
        name: vendor.name,
        companyName: vendor.companyName || null,
        email: vendor.email || null,
        phone: vendor.phone || null,
        status: vendor.status || 'active',
        category: vendor.category || null,
        service: primaryService,
        services: services,
        paymentTerms: vendor.paymentTerms || null,
        rating: rating ? `${rating.average}/5 Rating` : null,
        ratingValue: rating ? rating.average : null,
        totalReviews: rating ? rating.totalReviews : 0,
        lastInvoice: lastInvoiceMap[vendor.id] || null,
        totalPayable: vendor.totalPayable || 0,
        totalPaid: vendor.totalPaid || 0,
        balance: vendor.balance || 0,
        createdAt: iso(vendor.createdAt),
      };
    });

    return successResponse(res, {
      items,
      total,
      pagination: {
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }, 'Vendor contacts fetched successfully');
  } catch (error) {
    console.error('Vendor contacts error:', error);
    return errorResponse(res, 'Failed to fetch vendor contacts');
  }
};

const vendorContactDetails = async (req, res) => {
  try {
    const vendorId = parseId(req.params.id);
    if (!vendorId) return errorResponse(res, 'Valid vendor id is required', 400);

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        phone: true,
        alternatePhone: true,
        status: true,
        category: true,
        services: true,
        address: true,
        paymentTerms: true,
        totalPayable: true,
        totalPaid: true,
        balance: true,
        createdAt: true,
        notes: true,
      },
    });

    if (!vendor) return errorResponse(res, 'Vendor not found', 404);

    const scoreAggregate = await prisma.scoreCard.aggregate({
      where: { entityType: 'vendor', entityId: vendorId },
      _avg: { score: true },
      _count: { _all: true },
      _max: { createdAt: true },
    });

    const score = scoreAggregate?._count?._all
      ? {
          average: Number((scoreAggregate._avg.score || 0).toFixed(1)),
          totalReviews: scoreAggregate._count._all,
          lastRecordedAt: iso(scoreAggregate._max.createdAt),
        }
      : null;

    return successResponse(res, {
      profile: {
        ...vendor,
        createdAt: iso(vendor.createdAt),
      },
      score,
    }, 'Vendor contact details fetched successfully');
  } catch (error) {
    console.error('Vendor contact details error:', error);
    return errorResponse(res, 'Failed to fetch vendor contact details');
  }
};

module.exports = {
  sendEmailCampaign,
  tenantContacts,
  tenantContactDetails,
  employeeContacts,
  employeeContactDetails,
  vendorContacts,
  vendorContactDetails,
};

